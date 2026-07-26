import importlib
import inspect
import logging
import os
from pathlib import Path
from typing import List, Optional

from ..plugins.base import BasePlugin, PluginConfig, PluginError

logger = logging.getLogger(__name__)


def _discover_plugin_names(plugin_directory: Path) -> List[str]:
    if not plugin_directory.exists() or not plugin_directory.is_dir():
        logger.warning("Plugin directory does not exist: %s", plugin_directory)
        return []

    return [
        item.name
        for item in plugin_directory.iterdir()
        if item.is_dir()
        and (item / "__init__.py").exists()
        and item.name != "__pycache__"
    ]


def _plugin_env_enabled(plugin_name: str) -> Optional[bool]:
    env_key = f"PLUGIN_{plugin_name.upper()}_ENABLED"
    value = os.getenv(env_key)

    if value is None:
        return None

    return value.strip().lower() in {"1", "true", "yes", "on"}


def _load_plugin_config(plugin_name: str) -> PluginConfig:
    enabled_override = _plugin_env_enabled(plugin_name)
    enabled = enabled_override if enabled_override is not None else True

    settings_prefix = f"PLUGIN_{plugin_name.upper()}_"

    plugin_settings_map = {
        key[len(settings_prefix):].lower(): value
        for key, value in os.environ.items()
        if key.startswith(settings_prefix)
        and key != f"{settings_prefix}ENABLED"
    }

    return PluginConfig(
        name=plugin_name,
        enabled=enabled,
        settings=plugin_settings_map,
    )


def load_plugins() -> List[BasePlugin]:
    # Package containing plugins
    package = __package__.rsplit(".", 1)[0] + ".plugins"

    # Physical plugins folder
    root_dir = Path(__file__).resolve().parent.parent / "plugins"

    logger.info("Plugin package: %s", package)
    logger.info("Plugin directory: %s", root_dir)

    available_plugins = _discover_plugin_names(root_dir)

    logger.info("Discovered plugins: %s", available_plugins)

    plugins: List[BasePlugin] = []

    for plugin_name in available_plugins:

        plugin_config = _load_plugin_config(plugin_name)

        if not plugin_config.enabled:
            logger.info("Skipping disabled plugin: %s", plugin_name)
            continue

        try:
            module_name = f"{package}.{plugin_name}"

            logger.info("=" * 70)
            logger.info("Loading plugin: %s", plugin_name)
            logger.info("Importing module: %s", module_name)

            module = importlib.import_module(module_name)

            logger.info("Imported module: %s", module)
            logger.info("Module file: %s", getattr(module, "__file__", "Unknown"))

            plugin_class = getattr(module, "Plugin", None)

            if plugin_class is None:
                raise PluginError(
                    f"{plugin_name} does not expose a Plugin class"
                )

            if not inspect.isclass(plugin_class):
                raise PluginError(
                    f"{plugin_name}.Plugin is not a class"
                )

            logger.info("Plugin class: %s", plugin_class)
            logger.info("Plugin class module: %s", plugin_class.__module__)
            logger.info("Plugin class bases: %s", plugin_class.__bases__)

            logger.info("BasePlugin: %s", BasePlugin)
            logger.info("BasePlugin module: %s", BasePlugin.__module__)
            logger.info("BasePlugin id: %s", id(BasePlugin))

            for base in plugin_class.__bases__:
                logger.info(
                    "Base -> %s | module=%s | id=%s",
                    base,
                    base.__module__,
                    id(base),
                )

            subclass_result = issubclass(plugin_class, BasePlugin)

            logger.info("issubclass() result = %s", subclass_result)

            if not subclass_result:
                raise PluginError(
                    f"Plugin {plugin_name} must subclass BasePlugin"
                )

            plugin = plugin_class(config=plugin_config)

            plugins.append(plugin)

            logger.info("Successfully loaded plugin: %s", plugin_name)

        except Exception:
            logger.exception("Failed to load plugin %s", plugin_name)

    logger.info("Loaded %d plugins", len(plugins))

    return plugins