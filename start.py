"""字樣工坊本地啟動器：Python 標準庫、只監聽 127.0.0.1。"""
from functools import partial
from hashlib import sha256
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import ProxyHandler, build_opener
import argparse
import json
import socket
import threading
import webbrowser

ROOT=Path(__file__).resolve().parent
WEB=ROOT/'web'
APP='unicode-text-lab'
VERSION='0.2.0'
CSP="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"

def instance_id():
    return sha256(str(WEB.resolve()).encode('utf-8')).hexdigest()[:16]

class LoopbackServer(ThreadingHTTPServer):
    daemon_threads=True
    allow_reuse_address=False
    def server_bind(self):
        if hasattr(socket,'SO_EXCLUSIVEADDRUSE'):
            self.socket.setsockopt(socket.SOL_SOCKET,socket.SO_EXCLUSIVEADDRUSE,1)
        super().server_bind()

class StudioHandler(SimpleHTTPRequestHandler):
    server_version='GlyphStudio'
    sys_version=''
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'}
    def log_message(self,format,*args):
        # 不記錄網址查詢或輸入資料。
        return
    def end_headers(self):
        for name,value in {
            'Content-Security-Policy':CSP,
            'X-Content-Type-Options':'nosniff',
            'X-Frame-Options':'DENY',
            'Referrer-Policy':'no-referrer',
            'Cross-Origin-Resource-Policy':'same-origin',
            'Cache-Control':'no-cache',
            'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
        }.items(): self.send_header(name,value)
        super().end_headers()
    def _host_allowed(self):
        address=self.server.server_address
        assert isinstance(address,tuple)
        port=address[1]
        if self.headers.get('Host','').lower() not in {f'127.0.0.1:{port}',f'localhost:{port}'}:
            self.send_error(403,'Only loopback hosts are allowed')
            return False
        return True
    def _health(self,head=False):
        if urlsplit(self.path).path!='/__studio__/health': return False
        data=json.dumps({'app':APP,'version':VERSION,'instance':instance_id()}).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers()
        if not head: self.wfile.write(data)
        return True
    def do_GET(self):
        if self._host_allowed() and not self._health(): super().do_GET()
    def do_HEAD(self):
        if self._host_allowed() and not self._health(head=True): super().do_HEAD()
    def do_POST(self): self.send_error(405,'Read-only application')
    do_PUT=do_POST
    do_DELETE=do_POST
    def list_directory(self,path):
        self.send_error(404,'Directory listing disabled')
        return None
    def translate_path(self,path):
        translated=Path(super().translate_path(path)).resolve()
        try: translated.relative_to(WEB.resolve())
        except ValueError: return str(WEB/'.blocked-path')
        return str(translated)

def create_server(port=8787):
    return LoopbackServer(('127.0.0.1',port),partial(StudioHandler,directory=str(WEB)))

def is_same_instance(port):
    if port==0: return False
    opener=build_opener(ProxyHandler({}))
    try:
        with opener.open(f'http://127.0.0.1:{port}/__studio__/health',timeout=0.6) as response:
            data=json.loads(response.read(4096))
        return data.get('app')==APP and data.get('version')==VERSION and data.get('instance')==instance_id()
    except (OSError,ValueError): return False

def main():
    parser=argparse.ArgumentParser(description='啟動完全離線的字樣工坊')
    parser.add_argument('--port',type=int,default=8787)
    parser.add_argument('--no-browser',action='store_true')
    args=parser.parse_args()
    if not 0<=args.port<=65525: parser.error('port 必須介於 0 與 65525')
    if is_same_instance(args.port):
        url=f'http://127.0.0.1:{args.port}/'
        print('字樣工坊已在執行：'+url,flush=True)
        if not args.no_browser: webbrowser.open(url)
        return
    server=None
    for port in ([0] if args.port==0 else range(args.port,args.port+10)):
        try:
            server=create_server(port)
            break
        except OSError:
            continue
    if server is None: raise SystemExit('找不到可用的本地連接埠，請關閉舊啟動器後再試。')
    url=f'http://127.0.0.1:{server.server_address[1]}/'
    print('字樣工坊已啟動：'+url,flush=True)
    print('所有轉換留在本機。關閉此視窗或按 Ctrl+C 停止。',flush=True)
    if not args.no_browser:
        threading.Timer(0.3,lambda:webbrowser.open(url)).start()
    try: server.serve_forever(poll_interval=0.3)
    except KeyboardInterrupt: print('\n字樣工坊已停止。')
    finally: server.server_close()

if __name__=='__main__': main()
