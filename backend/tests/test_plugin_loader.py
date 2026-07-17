import importlib

from app.core.plugin_loader import _discover_plugin_names, _plugin_env_enabled


def test_discover_plugins(tmp_path, monkeypatch):
    p = tmp_path / "plugins"
    p.mkdir()
    (p / "fake" ).mkdir()
    (p / "fake" / "__init__.py").write_text("# fake")

    names = _discover_plugin_names(p)
    assert "fake" in names


def test_env_enabled(monkeypatch):
    monkeypatch.delenv("PLUGIN_TEST_ENABLED", raising=False)
    assert _plugin_env_enabled("test") is None
    monkeypatch.setenv("PLUGIN_TEST_ENABLED", "true")
    assert _plugin_env_enabled("test") is True
