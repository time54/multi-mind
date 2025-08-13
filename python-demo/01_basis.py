# 输入 & 输出
# name = input('请输入你的名字：')
# print('你好,', name)

#if else 条件判断
# age = input('请输入你的年龄：')
# age = int(age)
# if age >= 18:
#     print('你已经上大学了！')
# elif age >= 6:
#     print('你已经上小学了！')
# else:
#     print('你还是小朋友！')

# 模式匹配
# score = input('请输入你的等级：')
# match score:
#     case 'A':
#         print('你考了A！')
#     case 'B':
#         print('你考了B！')
#     case 'C':
#         print('你考了C！')
#     case _: # 默认值
#         print('score is ???.！')

# dict 字典
# d = { 'Tom': 12, 'Jerry': 18, 'Sum': 24}
# print(d['Jerry'])

# 函数
# 默认参数
# def power(x, n=2):
#     s = 1
#     while n > 0:
#         n = n -1
#         s = s * x
#     return s
# print(power(5))

# 可变参数: 允许传入0个或任意个参数
def calc(*numbers):
    sum = 0
    for n in numbers:
        sum = sum + n * n
    return sum
print(calc(1, 2, 3))
