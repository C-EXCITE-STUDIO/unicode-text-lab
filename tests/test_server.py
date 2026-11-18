import http.client
import json
from pathlib import Path
import threading
import unittest
from start import create_server

class LocalServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=create_server(0)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.port=cls.server.server_address[1]
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join(timeout=2)
    def request(self,path,method='GET',headers=None):
        conn=http.client.HTTPConnection('127.0.0.1',self.port,timeout=3)
        conn.request(method,path,headers=headers or {})
        response=conn.getresponse()
        result=(response.status,dict(response.getheaders()),response.read())
        conn.close(); return result
    def test_loopback_only(self):
        self.assertEqual(self.server.server_address[0],'127.0.0.1')
    def test_health_is_exact_application(self):
        status,headers,body=self.request('/__studio__/health')
        self.assertEqual(status,200)
        self.assertEqual(json.loads(body)['app'],'unicode-text-lab')
        root=Path(__file__).resolve().parents[1]
        expected=json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
        self.assertEqual(json.loads(body)['version'],expected)
        self.assertEqual(json.loads((root/'web/data/styles.json').read_text(encoding='utf-8'))['version'],expected)
    def test_safe_headers_and_static_js(self):
        status,headers,body=self.request('/js/engine.js')
        self.assertEqual(status,200)
        self.assertIn("connect-src 'self'",headers['Content-Security-Policy'])
        self.assertEqual(headers['X-Content-Type-Options'],'nosniff')
        self.assertEqual(headers['X-Frame-Options'],'DENY')
        self.assertNotIn('Access-Control-Allow-Origin',headers)
    def test_external_host_is_rejected(self):
        self.assertEqual(self.request('/__studio__/health',headers={'Host':'evil.example'})[0],403)
    def test_project_files_are_not_exposed(self):
        for path in ['/AGENTS.md','/.git/config','/../package.json','/%2e%2e/package.json','/sources/fontvibe-styles.json']:
            self.assertEqual(self.request(path)[0],404,path)
    def test_post_is_not_supported(self):
        self.assertEqual(self.request('/__studio__/health','POST')[0],405)
    def test_directory_listing_is_disabled(self):
        self.assertEqual(self.request('/licenses/')[0],404)

if __name__=='__main__': unittest.main()
