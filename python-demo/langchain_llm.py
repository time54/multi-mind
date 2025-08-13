# 导入Python的操作系统模块
import os
# dotenv： 用于从.env文件中加载环境变量
from dotenv import load_dotenv
# 调用项目根目录下的.env文件中的所有环境变量到系统环境变量中
load_dotenv()
api_key = os.getenv("DEEPSEEK_API_KEY")

# 使用专门的 langchain_deepseek 包
from langchain_deepseek import ChatDeepSeek

# 使用 DeepSeek API
llm = ChatDeepSeek(
    model_name='deepseek-chat',
    api_key=api_key,
    max_tokens=200
)
text = llm.invoke('请给我写一句情人节红玫瑰的中文宣传语,字数在20字以内')
print(text.content)


