import os
import subprocess
import time
import signal
import sys

def run_instances():
    """Запуск трех инстансов бота"""
    processes = []
    
    # Параметры для каждого инстанса
    instances = [
        {"file": "bot_1.py", "port": 8001},
        {"file": "bot_2.py", "port": 8002},
        {"file": "bot_3.py", "port": 8003}
    ]
    
    try:
        # Запускаем все инстансы
        for instance in instances:
            env = os.environ.copy()
            env["PORT"] = str(instance["port"])
            
            proc = subprocess.Popen(
                ["python", instance["file"]],
                env=env
            )
            processes.append(proc)
            print(f"Запущен {instance['file']} на порту {instance['port']} (PID: {proc.pid})")
            time.sleep(1)  # Небольшая задержка между запусками
        
        print("\nВсе инстансы запущены. Нажмите Ctrl+C для остановки.")
        
        # Ожидание завершения
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nОстанавливаю инстансы...")
        for proc in processes:
            proc.terminate()
            proc.wait()
        print("Все инстансы остановлены.")
    except Exception as e:
        print(f"Ошибка: {e}")
        for proc in processes:
            proc.terminate()
        sys.exit(1)

if __name__ == "__main__":
    run_instances()