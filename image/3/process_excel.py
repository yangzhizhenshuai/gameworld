import pandas as pd
import os

def process_data(input_excel_path, output_txt_path):
    """
    读取Excel文件，按指定格式处理数据，并保存到文本文件中。

    - Excel文件的列结构:
        - 第1列: 问题 (Q)
        - 第2列: 回答 (A)
        - 第3-5列: 拓展问题 (可能为空)
    """
    # 检查输入文件是否存在
    if not os.path.exists(input_excel_path):
        print(f"错误：找不到文件 '{input_excel_path}'")
        return

    try:
        # 读取Excel文件，header=None表示文件没有标题行
        df = pd.read_excel(input_excel_path, header=None)
        
        # 将所有NaN（空单元格）替换为空字符串，方便处理
        df = df.fillna('')

        # 打开输出文件准备写入
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            # 遍历DataFrame的每一行
            for index, row in df.iterrows():
                # 提取问题和回答
                # .get(0, '') 确保即使列不存在也不会报错，返回空字符串
                question = row.get(0, '')
                answer = row.get(1, '')

                # 如果主要问题或回答为空，则跳过此行
                if not str(question).strip() or not str(answer).strip():
                    continue

                # 写入主要问题
                f.write(f"Q: {question}\n")

                # 处理拓展问题 (第3列到第5列，即索引2到4)
                for i in range(2, 5):
                    ext_question = row.get(i, '')
                    # 如果拓展问题单元格有内容，则写入
                    if str(ext_question).strip():
                        f.write(f"{ext_question}\n")
                
                # 写入回答
                f.write(f"A: {answer}\n")

                # 写入分隔符
                f.write("------\n")
        
        print(f"处理完成！结果已成功保存到文件 '{output_txt_path}' 中。")

    except Exception as e:
        print(f"处理过程中发生错误: {e}")

# --- 主程序入口 ---
if __name__ == "__main__":
    # --- 请在这里配置你的文件名 ---
    input_filename = "data.xlsx"  # 你的Excel文件名
    output_filename = "output.txt" # 你希望输出的文本文件名

    # 运行处理函数
    process_data(input_filename, output_filename)
