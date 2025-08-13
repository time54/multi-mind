import os

# 1. 加载 document 文档
from langchain_community.document_loaders import TextLoader
# 需要额外安装 pypdf 库
from langchain_community.document_loaders import PyPDFLoader
# 需要额外安装 docx2txt 库
from langchain_community.document_loaders import Docx2txtLoader

script_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.join(script_dir, 'file')
documents = []
for file in os.listdir(base_dir):
    # 过滤掉 .DS_Store 等系统文件
    if file.startswith('.'):
        continue
    # 构建完整的文件路径
    file_path = os.path.join(base_dir, file)
    if file.endswith('.txt'):
        loader = TextLoader(file_path)
        documents.extend(loader.load())
    elif file.endswith('.pdf'):
        loader = PyPDFLoader(file_path)
        documents.extend(loader.load())
    elif file.endswith('.docx'):
        loader = Docx2txtLoader(file_path)
        documents.extend(loader.load())

# 2. 文本的分割: 将Documents切分成块以便后续进行嵌入和向量存储
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 创建文本分割器：每个文本块的最大字符数为200，相邻文本块之间有10个字符的重叠【作用：保持上下文的连续性】
text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=10)
# 将之前加载的所有文档进行分割，返回分割后的文档块列表
chunked_documents = text_splitter.split_documents(documents)

# 3. 将分割的文本块进行向量化,并存入向量数据库中
# 需要额外安装 sentence-transformers 库
from langchain_huggingface import HuggingFaceEmbeddings
# 需要额外安装 qdrant-client 库
from langchain_community.vectorstores import Qdrant

# 设置 tokenizers 并行化环境变量，避免 fork 后的死锁警告
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# 选择中文效果好的 bge-large-zh
# 如果显存不足，可以换成 "moka-ai/m3e-base"
# 使用本地已下载的模型，避免网络连接问题
model_path = os.path.expanduser("~/.cache/huggingface/hub/models--BAAI--bge-large-zh/snapshots/b5d9f5c027e87b6f0b6fa4b614f8f9cdc45ce0e8")
embeddings = HuggingFaceEmbeddings(model_name=model_path)

# 存入向量数据库（内存模式）
# vectorstore：LangChain 的向量库对象
vectorstore = Qdrant.from_documents(
    documents = chunked_documents,
    embedding = embeddings,
    # 内存模式：将向量存储在内存中，不持久化到磁盘
    location = ':memory:',
    collection_name = 'my_documents'
)

print("✅ 向量化完成，已存入 Qdrant（本地内存模式）")

# 4. 问答系统：准备模型和Retrieval链
import logging
# dotenv： 用于从.env文件中加载环境变量
from dotenv import load_dotenv
# 调用项目根目录下的.env文件中的所有环境变量到系统环境变量中
load_dotenv()
api_key = os.getenv("DEEPSEEK_API_KEY")
from langchain_deepseek import ChatDeepSeek
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# 设置Logging, 调试和监控
# 通过日志可以看到：
#   原始用户问题、生成的多个查询变体、检索过程的信息
logging.basicConfig()
logging.getLogger('langchain.retrievers.multi_query').setLevel(logging.INFO)

# 实例化一个大模型工具 - DeepSeek的ChatDeepSeek
llm = ChatDeepSeek(
    model_name='deepseek-chat',
    api_key=api_key,
    max_tokens=200
)

# 把用户原问题扩展成多个"等价但互补"的查询，分别去向量库检索，再合并去重，提升召回覆盖率与相关性
# k：每次检索返回与查询最相似的前 4 条文档块
base_retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# 优化自定义检索 prompt
retrieval_prompt = PromptTemplate(
    input_variables=["question"],
    template="""你是一个专业的文档检索助手。请根据用户的问题，生成3个不同的检索查询，以帮助找到最相关的文档片段。
        用户问题: {question}
        请生成3个不同的检索查询，每个查询都应该从不同角度来检索相关信息：
            1. 直接相关查询：
            2. 扩展相关查询：
            3. 同义词/近义词查询：
        只返回查询内容，不要其他解释。"""
)

# Retrieval链的核心组件： 检索器 (Retriever)， 从向量数据库中检索相关文档
# llm： 用于检索优化
retriever_from_llm = MultiQueryRetriever.from_llm(
    retriever=base_retriever,
    llm=llm,
    prompt=retrieval_prompt
)

# 优化自定义问答 prompt
qa_prompt_template = """你是一个专业的文档问答助手。请严格按照以下格式输出答案：
   用户问题: {question}
   相关内容：{context}
   请按照以下格式回答：
       1. 直接回答：根据文档内容直接回答用户问题
       2. 补充说明：如果有其他相关信息，请补充说明
    如果文档中没有相关信息，请明确说明"根据提供的文档，我无法找到相关信息"。
    回答："""

qa_prompt = PromptTemplate(
    template=qa_prompt_template,
    input_variables=["context", "question"]
)

# RetrievalQA链：把"上一步检索到的文档"作为上下文，喂给大模型生成最终答案
qa_chain = RetrievalQA.from_chain_type(
    llm,
    retriever=retriever_from_llm,
    # stuff: 把若干文档直接拼接后一次性给模型
    chain_type="stuff",
    chain_type_kwargs={"prompt": qa_prompt},
    # 返回源文档信息
    return_source_documents=True
)

# 5. 问答系统： UI实现
from flask import Flask, request, render_template
app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        # 接收用户输入作为问题
        question = request.form.get('question')        
        # RetrievalQA链 - 读入问题，生成答案
        result = qa_chain.invoke({"query": question})
        print('result:', result)
        
        # 处理源文档信息，提取文件名和内容
        source_docs = []
        if result and "source_documents" in result:
            for i, doc in enumerate(result["source_documents"]):
                # 提取文件名
                file_name = doc.metadata.get('source', '未知文件')
                # 只显示文件名，不显示完整路径
                file_name = file_name.split('/')[-1] if '/' in file_name else file_name
                
                source_docs.append({
                    'index': i + 1,
                    'file_name': file_name,
                    'content': doc.page_content[:200] + '...' if len(doc.page_content) > 200 else doc.page_content,
                    'full_content': doc.page_content
                })
        # 把大模型的回答结果和源文档信息返回网页进行渲染
        return render_template('index.html', result=result, source_docs=source_docs)
    return render_template('index.html')
if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True,port=5500)





