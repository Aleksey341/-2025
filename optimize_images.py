#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт оптимизации изображений для проекта "Новогодний адвент"
Конвертирует PNG в WebP и оптимизирует оригиналы.

Требуемые библиотеки: pip install Pillow
"""

import os
import sys
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("[ERROR] Pillow not installed. Run: pip install Pillow")
    sys.exit(1)


# Настройки оптимизации
WEBP_QUALITY = 85  # Качество WebP (0-100)
PNG_OPTIMIZE = True  # Оптимизировать PNG
RESIZE_THRESHOLD = 2000  # Максимальная ширина/высота в px


def get_file_size_kb(path):
    """Получить размер файла в KB"""
    return os.path.getsize(path) / 1024


def optimize_image(input_path, output_dir=None):
    """
    Оптимизирует изображение:
    1. Конвертирует в WebP
    2. Оптимизирует оригинальный PNG
    3. Уменьшает размер если изображение слишком большое
    """
    input_path = Path(input_path)
    output_dir = Path(output_dir) if output_dir else input_path.parent

    if not input_path.exists():
        print(f"[WARN] File not found: {input_path}")
        return None

    original_size = get_file_size_kb(input_path)
    results = {
        'file': input_path.name,
        'original_size_kb': original_size,
        'webp_size_kb': 0,
        'optimized_png_kb': 0,
        'savings_percent': 0
    }

    try:
        with Image.open(input_path) as img:
            width, height = img.size

            # Уменьшаем если слишком большое
            if width > RESIZE_THRESHOLD or height > RESIZE_THRESHOLD:
                ratio = min(RESIZE_THRESHOLD / width, RESIZE_THRESHOLD / height)
                new_size = (int(width * ratio), int(height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                print(f"   [RESIZE] {width}x{height} -> {new_size[0]}x{new_size[1]}")

            # Создаём WebP версию
            webp_path = output_dir / (input_path.stem + '.webp')

            # Конвертируем в RGB если нужно для WebP (сохраняем альфа-канал)
            if img.mode in ('RGBA', 'LA', 'P'):
                img_to_save = img.convert('RGBA')
            else:
                img_to_save = img.convert('RGB')

            img_to_save.save(webp_path, 'WEBP', quality=WEBP_QUALITY, method=6)
            results['webp_size_kb'] = get_file_size_kb(webp_path)

            # Считаем экономию (WebP vs оригинал)
            if original_size > 0:
                results['savings_percent'] = round(
                    (1 - results['webp_size_kb'] / original_size) * 100, 1
                )

            results['optimized_png_kb'] = original_size  # Оставляем оригинал

    except Exception as e:
        print(f"[ERROR] Processing {input_path}: {e}")
        return None

    return results


def process_directory(source_dir, output_dir=None):
    """Обрабатывает все изображения в директории"""
    source_dir = Path(source_dir)
    output_dir = Path(output_dir) if output_dir else source_dir

    if not source_dir.exists():
        print(f"[ERROR] Directory not found: {source_dir}")
        return

    output_dir.mkdir(parents=True, exist_ok=True)

    # Поддерживаемые форматы
    image_extensions = {'.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'}

    # Находим все изображения
    images = [f for f in source_dir.iterdir()
              if f.is_file() and f.suffix in image_extensions]

    if not images:
        print(f"[INFO] No images found in {source_dir}")
        return

    print(f"\n[INFO] Found {len(images)} images")
    print("=" * 60)

    total_original = 0
    total_webp = 0
    results_list = []

    for img_path in sorted(images):
        print(f"\n[PROCESS] {img_path.name}")
        result = optimize_image(img_path, output_dir)

        if result:
            results_list.append(result)
            total_original += result['original_size_kb']
            total_webp += result['webp_size_kb']

            print(f"   PNG:  {result['original_size_kb']:.1f} KB")
            print(f"   WebP: {result['webp_size_kb']:.1f} KB (savings: {result['savings_percent']}%)")

    # Итоговая статистика
    print("\n" + "=" * 60)
    print("[SUMMARY]")
    print(f"   Original (PNG): {total_original:.1f} KB ({total_original/1024:.2f} MB)")
    print(f"   WebP:           {total_webp:.1f} KB ({total_webp/1024:.2f} MB)")

    if total_original > 0:
        total_savings = (1 - total_webp / total_original) * 100
        print(f"   Total savings:  {total_savings:.1f}%")

    print("=" * 60)

    return results_list


if __name__ == '__main__':
    print("Image Optimizer for New Year Advent Project")
    print("=" * 60)

    # Путь к репозиторию проекта
    if len(sys.argv) > 1:
        project_dir = Path(sys.argv[1])
    else:
        project_dir = Path('.')

    print(f"[INFO] Project directory: {project_dir.absolute()}")

    # Обрабатываем изображения в корне
    print("\n[STEP] Processing root directory...")
    process_directory(project_dir, project_dir)

    # Обрабатываем поддиректории с региональным контентом
    subdirs = ['Novosib1', 'SPB', 'Архангельск', 'Дальний восток',
               'Кировская', 'Нижний Новгород', 'Самара', 'ЯНАО']

    for subdir in subdirs:
        subdir_path = project_dir / subdir
        if subdir_path.exists():
            print(f"\n[STEP] Processing: {subdir}/")
            process_directory(subdir_path, subdir_path)

    print("\n" + "=" * 60)
    print("[DONE] Optimization complete!")
    print("\nWebP files created. Use <picture> tag for fallback support.")
