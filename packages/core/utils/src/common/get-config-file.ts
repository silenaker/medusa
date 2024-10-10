import { join } from "path"
import fs from "fs"

/**
 * Attempts to resolve the config file in a given root directory.
 * @param {string} rootDir - the directory to find the config file in.
 * @param {string} configName - the name of the config file.
 * @return {object} an object containing the config module and its path as well as an error property if the config couldn't be loaded.
 */
export function getConfigFile<TConfig = unknown>(
  rootDir: string,
  configName: string
): { configModule: TConfig; configFilePath: string; error?: any } {
  const extNames = [".js", ".cjs"]
  const configPaths = extNames.map((ext) => join(rootDir, configName + ext))

  let configFilePath
  let configModule
  let err

  for (let i = 0; i < configPaths.length; i++) {
    if (fs.existsSync(configPaths[i])) {
      configFilePath = configPaths[i]
      break
    }
  }

  if (!configFilePath) {
    return {
      configModule,
      configFilePath,
      error: new Error(`Cannot found file ${configName}`),
    }
  }

  try {
    configModule = require(configFilePath)
  } catch (e) {
    err = e
  }

  if (configModule && typeof configModule.default === "object") {
    configModule = configModule.default
  }

  return { configModule, configFilePath, error: err }
}
