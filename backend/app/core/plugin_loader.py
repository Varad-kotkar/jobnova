import importlib
import inspect
import logging
import os
from pathlib import Path
from typing import Iterable, List, Optional

from ..config.plugins import plugin_settings
from ..plugins.base import BasePlugin, PluginConfig, PluginError

logger = logging.getLogger(__name__)


def _discover_plugin_names(plugin_directory: Path) -> List[str]:
    if not plugin_directory.exists() or not plugin_directory.is_dir():
        logger.warning("Plugin directory does not exist: %s", plugin_directory)
        return []

    return [
        item.name
        for item in plugin_directory.iterdir()
        if item.is_dir() and (item / "__init__.py").exists()
    ]


def _plugin_env_enabled(plugin_name: str) -> Optional[bool]:
    env_key = f"PLUGIN_{plugin_name.upper()}_ENABLED"
    raw_value = os.getenv(env_key)
    if raw_value is None:
        return None
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _load_plugin_config(plugin_name: str) -> PluginConfig:
    enabled_override = _plugin_env_enabled(plugin_name)
    enabled = enabled_override if enabled_override is not None else True
    settings_prefix = f"PLUGIN_{plugin_name.upper()}_"
    plugin_settings_map = {
        key[len(settings_prefix) :].lower(): value
        for key, value in os.environ.items()
        if key.startswith(settings_prefix) and key != f"{settings_prefix}ENABLED"
    }
    return PluginConfig(name=plugin_name, enabled=enabled, settings=plugin_settings_map)


def load_plugins() -> List[BasePlugin]:
    package = "app.plugins"
    root_dir = Path(__file__).resolve().parent.parent / "plugins"
    available_plugins = _discover_plugin_names(root_dir)
    enabled_plugins = []

    plugins: List[BasePlugin] = []
    for plugin_name in available_plugins:
        if enabled_plugins and plugin_name.lower() not in enabled_plugins:
            logger.info("Skipping plugin %s because it is not enabled", plugin_name)
            continue

        plugin_config = _load_plugin_config(plugin_name)
        if not plugin_config.enabled:
            logger.info("Plugin %s is disabled via environment variable", plugin_name)
            continue

        try:
            module = importlib.import_module(f"{package}.{plugin_name}")
            plugin_class = getattr(module, "Plugin", None)
            if plugin_class is None or not inspect.isclass(plugin_class):
                raise PluginError(f"Plugin {plugin_name} does not expose a Plugin class")
            if not issubclass(plugin_class, BasePlugin):
                raise PluginError(f"Plugin {plugin_name} must subclass BasePlugin")

            plugin = plugin_class(config=plugin_config)
            plugins.append(plugin)
            logger.info("Loaded plugin %s", plugin_name)
        except Exception as exc:
            logger.exception("Failed to load plugin %s", plugin_name)
            continue

    return plugins
