import os

# 导入LangChain中的提示模板
from langchain.prompts import PromptTemplate
prompt_template = """您是一位专业的商品文案撰写员。
    对于售价为 {price} 元的 {product_name}, 您能提供一个吸引人的简短描述嘛？
    {format_instructions}
"""

# dotenv： 用于从.env文件中加载环境变量
from dotenv import load_dotenv
# 调用项目根目录下的.env文件中的所有环境变量到系统环境变量中
load_dotenv()
api_key = os.getenv("DEEPSEEK_API_KEY")

from langchain_deepseek import ChatDeepSeek
# 实例化一个大模型工具 - DeepSeek的ChatDeepSeek
llm = ChatDeepSeek(
    model_name='deepseek-chat',
    api_key=api_key,
    max_tokens=200
)

# 导入结构化输出解析器和ResponseSchema
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
# 定义我们想要接收的响应模式
response_schemas = [
    ResponseSchema(name='description', description='商品的描述文案'),
    ResponseSchema(name='reason', description='问为什么要这样写文案')
]

# 创建输出解析器
output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

# 获取格式指示
fromat_instructions = output_parser.get_format_instructions()

# 根据原始模板创建提示，同时在提示中加入输出解析器的说明
prompt = PromptTemplate.from_template(
    prompt_template, 
    partial_variables={'format_instructions': fromat_instructions}
)

# 数据准备
products = ["玫瑰", "百合", "康乃馨"]
prices = ["50", "30", "20"]

# pandas：Python中用于数据处理和分析的核心库
import pandas as pd
# 创建一个空的DataFrame对象
# product	price	description           	reason
#  玫瑰	     50 	浪漫玫瑰，传递爱的芬芳...	玫瑰象征爱情，价格适中...
#  百合      30	    纯洁百合，清新淡雅...	   百合代表纯洁，价格亲民...
df = pd.DataFrame(columns=["product", "price", "description", "reason"]) 

for product, price in zip(products, prices):
    # 使用 prompt.format()方法将变量插入到提示模板中
    input = prompt.format(product_name=product, price=price)

    # 获取模型的输出
    output = llm.invoke(input)
    
    # 解析模型的输出（这是一个字典结构）
    parsed_output = output_parser.parse(output.content)

    # 在解析后的输出中添加“product”和“price”
    parsed_output['product'] = product
    parsed_output['price'] = price

    # 将解析后的输出添加到DataFrame中
    df.loc[len(df)] = parsed_output  

# 将DataFrame "按行记录"的方式转换为字典列表格式
# 输出格式：[
#     {
#         'product': '玫瑰',
#         'price': '50',
#         'description': '浪漫玫瑰，传递爱的芬芳...',
#         'reason': '玫瑰象征爱情，价格适中...'
#     },
#     .......
# ]
print(df.to_dict(orient='records'))

# 保存DataFrame到CSV文件
df.to_csv("flowers_with_descriptions.csv", index=False)





