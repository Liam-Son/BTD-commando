import json, threading, time, urllib.request
from http.client import HTTPConnection
import sergeant_local as sgt


def test_refuses_live_order():
    text = sgt.answer("place order with my api key", "")
    assert "Negative" in text
    assert "broker" in text.lower()


def test_flags_same_close_risk():
    notes = sgt.flags("signal on close and fill on close")
    assert any("next open" in note for note in notes)


def test_scan_skips_vendor_dirs(tmp_path):
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "skip.py").write_text("print(1)\n", encoding="utf-8")
    (tmp_path / "strategy.py").write_text("print(2)\n", encoding="utf-8")
    found = sgt.scan(tmp_path)
    assert found == ["strategy.py"]


def test_local_server_answers_on_this_computer(tmp_path):
    (tmp_path / "strategy.py").write_text("print(1)\n", encoding="utf-8")
    thread = threading.Thread(target=lambda: sgt.serve(tmp_path, port=8766), daemon=True)
    thread.start()
    deadline = time.time() + 3
    ready = False
    while time.time() < deadline:
        try:
            with urllib.request.urlopen("http://127.0.0.1:8766/ready", timeout=0.2) as response:
                ready = json.load(response)["ready"] is True
                break
        except OSError:
            time.sleep(0.05)
    assert ready
    request = urllib.request.Request(
        "http://127.0.0.1:8766/chat",
        data=json.dumps({"message": "hello"}).encode(),
        headers={"Content-Type": "application/json", "Origin": "https://btd.noviark.net"},
    )
    with urllib.request.urlopen(request, timeout=2) as response:
        body = json.load(response)
        assert response.headers["Access-Control-Allow-Origin"] == "https://btd.noviark.net"
        assert body["rank"] == "SERGEANT"
        assert "Sergeant local is on" in body["message"]
    connection = HTTPConnection("127.0.0.1", 8766, timeout=2)
    connection.request("OPTIONS", "/chat", headers={
        "Origin": "https://btd.noviark.net",
        "Access-Control-Request-Private-Network": "true",
        "Access-Control-Request-Method": "POST",
    })
    options = connection.getresponse()
    assert options.status == 204
    assert options.getheader("Access-Control-Allow-Private-Network") == "true"
    options.read()
    connection.close()
