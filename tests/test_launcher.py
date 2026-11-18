import os
from pathlib import Path
import subprocess
import threading
import unittest
from start import create_server

@unittest.skipUnless(os.name=='nt','僅測試 Windows 雙擊啟動器')
class LauncherTests(unittest.TestCase):
    def test_works_without_python_on_explorer_path(self):
        tools=Path(os.environ.get('LOCALAPPDATA',''))/'hermes/tools'
        if not any(tools.glob('python-*/python.exe')):
            self.skipTest('環境沒有 Hermes 附帶的 Python')
        server=create_server(0)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        port=server.server_address[1]
        root=Path(__file__).resolve().parents[1]
        env=os.environ.copy()
        win=Path(env.get('SystemRoot','C:/Windows'))
        env['PATH']=str(win/'System32')+';'+str(win)
        env.pop('PYTHONHOME',None)
        try:
            command='"'+str(win/'System32/cmd.exe')+'" /d /s /c ""'+str(root/'啟動字樣工坊.cmd')+'" --no-browser --port '+str(port)+'"'
            result=subprocess.run(command,input='',capture_output=True,text=True,encoding='utf-8',errors='replace',env=env,timeout=12)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)
            self.assertIn('127.0.0.1:'+str(port),result.stdout)
        finally:
            server.shutdown();server.server_close();thread.join(timeout=2)

if __name__=='__main__': unittest.main()
