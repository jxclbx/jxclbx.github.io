import sys
import json
import os
import re
import shutil
from datetime import datetime
from PySide6.QtWidgets import (QApplication, QMainWindow, QTabWidget, QWidget, QVBoxLayout, 
                             QHBoxLayout, QTableWidget, QTableWidgetItem, QPushButton, 
                             QLineEdit, QLabel, QFileDialog, QMessageBox, QFormLayout, QTextEdit)
from PySide6.QtGui import QPixmap, QIcon
from PySide6.QtCore import Qt
from PIL import Image
from PIL.ExifTags import TAGS

class JetPhotosManager(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("JetPhotos Manager - 航空摄影管理系统")
        self.resize(1100, 800)
        self.data_file = 'data.json'
        self.config_file = 'config.js'
        self.photos_dir = 'photos/'
        
        self.all_data = []
        self.load_data()
        
        # 初始化 UI
        self.init_ui()

    def load_data(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r', encoding='utf-8') as f:
                self.all_data = json.load(f)

    def save_json(self):
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.all_data, f, indent=4, ensure_ascii=False)

    def init_ui(self):
        self.tabs = QTabWidget()
        self.setCentralWidget(self.tabs)

        # 1. 照片管理标签
        self.photo_tab = QWidget()
        self.init_photo_tab()
        self.tabs.addTab(self.photo_tab, "照片管理 (CRUD)")

        # 2. 基础设置标签
        self.settings_tab = QWidget()
        self.init_settings_tab()
        self.tabs.addTab(self.settings_tab, "网页基础设置")

        # 3. 器材字典管理
        self.gear_tab = QWidget()
        self.init_gear_tab()
        self.tabs.addTab(self.gear_tab, "器材字典管理")

    # ================= 1. 照片管理逻辑 =================
    def init_photo_tab(self):
        layout = QVBoxLayout()
        
        # 工具栏
        toolbar = QHBoxLayout()
        btn_add = QPushButton("新增照片")
        btn_add.clicked.connect(self.add_photo_dialog)
        btn_refresh = QPushButton("刷新列表")
        btn_refresh.clicked.connect(self.refresh_table)
        toolbar.addWidget(btn_add)
        toolbar.addWidget(btn_refresh)
        toolbar.addStretch()
        layout.addLayout(toolbar)

        # 表格
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["ID", "注册号", "航司", "机型", "机场", "日期"])
        self.table.setSelectionBehavior(QTableWidget.SelectRows)
        layout.addWidget(self.table)
        
        btn_del = QPushButton("删除选中照片")
        btn_del.setStyleSheet("background-color: #ff4d4d; color: white;")
        btn_del.clicked.connect(self.delete_photo)
        layout.addWidget(btn_del)

        self.photo_tab.setLayout(layout)
        self.refresh_table()

    def refresh_table(self):
        self.load_data()
        self.table.setRowCount(len(self.all_data))
        for i, item in enumerate(self.all_data):
            self.table.setItem(i, 0, QTableWidgetItem(str(item.get('id'))))
            self.table.setItem(i, 1, QTableWidgetItem(item.get('reg')))
            self.table.setItem(i, 2, QTableWidgetItem(item.get('airline')))
            self.table.setItem(i, 3, QTableWidgetItem(item.get('model')))
            self.table.setItem(i, 4, QTableWidgetItem(item.get('airport')))
            self.table.setItem(i, 5, QTableWidgetItem(item.get('date')))

    def add_photo_dialog(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "选择照片", "", "Images (*.jpg *.jpeg *.png)")
        if not file_path: return

        # 自动提取 EXIF 信息
        exif_data = self.get_exif(file_path)
        
        # 简单的新增逻辑（这里可以弹出一个对话框让用户填 Reg/Airline 等，此处演示为控制台/默认值）
        new_id = max([item['id'] for item in self.all_data]) + 1 if self.all_data else 1
        file_name = os.path.basename(file_path)
        dest_path = os.path.join(self.photos_dir, file_name)
        
        # 复制文件
        shutil.copy(file_path, dest_path)

        new_photo = {
            "id": new_id,
            "src": f"photos/{file_name}",
            "airline": "Unknown Airline",
            "reg": "Unknown Reg",
            "model": "Unknown Model",
            "airport": "SZX",
            "date": exif_data.get('DateTimeOriginal', datetime.now().strftime("%Y-%m-%d")),
            "featured": False
        }
        self.all_data.append(new_photo)
        self.save_json()
        self.refresh_table()
        QMessageBox.information(self, "成功", f"照片已导入，ID: {new_id}。请在表格中双击修改详细信息。")

    def delete_photo(self):
        curr_row = self.table.currentRow()
        if curr_row < 0: return
        
        confirm = QMessageBox.question(self, "确认", "确定要删除这张照片吗？(JSON数据将被移除)")
        if confirm == QMessageBox.Yes:
            self.all_data.pop(curr_row)
            self.save_json()
            self.refresh_table()

    def get_exif(self, path):
        info = {}
        try:
            img = Image.open(path)
            exif = img._getexif()
            if exif:
                for tag, value in exif.items():
                    decoded = TAGS.get(tag, tag)
                    if decoded == "DateTimeOriginal":
                        info[decoded] = value.split(' ')[0].replace(':', '-')
        except: pass
        return info

    # ================= 2. 基础设置逻辑 =================
    def init_settings_tab(self):
        layout = QFormLayout()
        
        self.set_avatar = QLineEdit()
        self.set_pinned = QLineEdit() # 对应 PINNED_IDS
        self.set_location = QLineEdit()
        self.set_hobbies = QLineEdit()

        layout.addRow("头像图片路径:", self.set_avatar)
        layout.addRow("首页Top 3 ID (逗号分隔):", self.set_pinned)
        layout.addRow("个人位置信息:", self.set_location)
        layout.addRow("爱好 (逗号分隔):", self.set_hobbies)

        btn_save_sets = QPushButton("保存网页设置")
        btn_save_sets.clicked.connect(self.save_general_settings)
        layout.addWidget(btn_save_sets)

        self.settings_tab.setLayout(layout)
        self.load_general_settings()

    def load_general_settings(self):
        # 从 config.js 或相关 JS 文件中读取（示例逻辑）
        # 这里建议将 PINNED_IDS 也放入 config.js 方便管理
        pass

    def save_general_settings(self):
        QMessageBox.information(self, "提示", "设置已保存 (需要对接文件正则读写)")

    # ================= 3. 器材字典管理 =================
    def init_gear_tab(self):
        layout = QVBoxLayout()
        self.gear_edit = QTextEdit()
        self.gear_edit.setPlaceholderText("这里将显示并编辑 config.js 中的 GEAR 对象...")
        layout.addWidget(self.gear_edit)
        
        btn_gear = QPushButton("同步并保存器材字典")
        btn_gear.clicked.connect(self.save_gear_config)
        layout.addWidget(btn_gear)
        
        self.gear_tab.setLayout(layout)
        self.load_gear_config()

    def load_gear_config(self):
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.gear_edit.setText(f.read())

    def save_gear_config(self):
        with open(self.config_file, 'w', encoding='utf-8') as f:
            f.write(self.gear_edit.toPlainText())
        QMessageBox.information(self, "成功", "器材字典 config.js 已更新！")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = JetPhotosManager()
    window.show()
    sys.exit(app.exec())