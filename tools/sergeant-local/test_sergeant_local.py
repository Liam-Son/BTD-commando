import sergeant_local as sgt


def test_refuses_live_order():
    text = sgt.answer("place order with my api key", "")
    assert "Negative" in text
    assert "broker" in text.lower()


def test_flags_same_close_risk():
    notes = sgt.flags("signal on close and fill on close")
    assert any("later bar" in note for note in notes)


def test_scan_skips_vendor_dirs(tmp_path):
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "skip.py").write_text("print(1)\n", encoding="utf-8")
    (tmp_path / "strategy.py").write_text("print(2)\n", encoding="utf-8")
    found = sgt.scan(tmp_path)
    assert found == ["strategy.py"]
