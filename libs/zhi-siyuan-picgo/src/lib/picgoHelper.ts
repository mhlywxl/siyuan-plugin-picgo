// noinspection TypeScriptValidateJSTypes

/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import _ from "lodash-es"
import {
  IBusEvent,
  IConfig,
  IPicBedType,
  IPicGo,
  IPicGoPlugin,
  IUploaderConfigItem,
  IUploaderConfigListItem,
  picgoEventBus,
  win,
} from "universal-picgo"
import { getRawData, trimValues } from "./utils/utils"
import { readonly } from "vue"
import IdUtil from "./utils/idUtil"
import { IGuiMenuItem } from "./types"
import { handleConfigWithFunction, handleStreamlinePluginName } from "./utils/common"
import { IPicGoHelperType } from "./utils/enums"

/**
 * PicGo 自定义事件
 */
enum PicgoHelperEvents {
  REFRESH_PLUGIN_LIST = "refreshPluginList",
  DO_PICGO_CONFIG_PLUGIN = "doPicgoConfigPlugin",
  HANDLE_PLUGIN_ING = "handlePluginIng",
  HANDLE_PLUGIN_UNINSTALLED = "handlePluginUninstalled",
  HANDLE_PLUGIN_UPDATED = "handlePluginUpdated",
}

/**
 * picgo 工具类
 *
 * @version 1.6.0
 * @since 1.6.0
 * @author terwer
 */
class PicgoHelper {
  private readonly ctx: IPicGo
  /**
   * !!! 这个 cfg 是响应式的，修改这个会自动完成持久化
   *
   * !!! 这个 cfg 是响应式的，修改这个会自动完成持久化
   *
   * !!! 这个 cfg 是响应式的，修改这个会自动完成持久化
   *
   * @private
   */
  private readonly reactiveCfg: IConfig
  private readonly readonlyCfg: IConfig

  /**
   * PicGo 帮助类
   *
   * @param ctx 上下文
   * @param reactiveCfg 响应式配置对象
   */
  constructor(ctx: IPicGo, reactiveCfg: IConfig) {
    if (!ctx) {
      throw new Error("PicGo ctx cannot be null")
    }
    if (!reactiveCfg) {
      throw new Error("PicGo reactive config cannot be null")
    }
    this.ctx = ctx
    this.reactiveCfg = reactiveCfg
    this.readonlyCfg = readonly(this.reactiveCfg)
  }

  /**
   * 根据 key 获取配置项
   *
   * @param key
   * @param defaultValue
   */
  public getPicgoConfig(key?: string, defaultValue?: any) {
    if (!key) {
      return this.readonlyCfg as unknown
    }
    return _.get(this.readonlyCfg, key, defaultValue)
  }

  /**
   * 保存配置
   *
   * @param cfg
   */
  public savePicgoConfig(cfg: Partial<IConfig>) {
    if (!cfg) {
      console.warn(`cfg can not be undefined `)
      return
    }
    // 刷新
    Object.keys(cfg).forEach((name: string) => {
      const rawCfg = getRawData(cfg)
      _.set(this.reactiveCfg, name, rawCfg[name])
      picgoEventBus.emit(IBusEvent.CONFIG_CHANGE, {
        configName: name,
        value: rawCfg[name],
      })
    })
  }

  // ===================================================================================================================

  /**
   * 注册 PicGo 事件（仅触发一次）
   *
   * @param eventName
   * @param listener
   */
  public bindOncePicgoEvent(eventName: string, listener: any) {
    picgoEventBus.on(eventName, listener)
  }

  /**
   * 注册 PicGo 事件
   *
   * @param eventName
   * @param listener
   */
  public bindPicgoEvent(eventName: string, listener: any) {
    picgoEventBus.on(eventName, listener)
  }

  /**
   * 取消注册 PicGo 事件
   *
   * @param eventName
   * @param listener
   */
  public unbindPicgoEvent(eventName: string, listener: any) {
    picgoEventBus.off(eventName, listener)
  }

  /**
   * 触发事件
   *
   * @param eventName
   * @param args
   */
  public triggerPicgoEvent(eventName: string, args?: any) {
    picgoEventBus.emit(eventName, args)
  }

  // ===================================================================================================================

  /**
   * 获取所有的图床列表
   */
  public getPicBeds(): IPicBedType[] {
    const picBedTypes = this.ctx.helper.uploader.getIdList()
    const picBedFromDB = this.getPicgoConfig("picBed.list") || []

    const picBeds = picBedTypes
      .map((item: any) => {
        const visible = picBedFromDB.find((i: any) => i.type === item) // object or undefined
        return {
          type: item,
          name: this.ctx.helper.uploader.get(item).name || item,
          visible: visible ? visible.visible : true,
        }
      })
      .sort((a: any) => {
        if (a.type === "github") {
          return -1
        }
        return 0
      })

    return picBeds
  }

  /**
   * 获取启用的图床
   */
  public getVisiablePicBeds(): IPicBedType[] {
    const picBeds = this.getPicBeds()
    const visiablePicBeds = picBeds
      .map((item: IPicBedType) => {
        if (item.visible) {
          return item
        }
        return null
      })
      .filter((item: any) => item) as IPicBedType[]

    // SM.MS是必选的
    if (visiablePicBeds.length == 0) {
      const defaultPicbed = {
        type: "smms",
        name: "SM.MS",
      } as IPicBedType
      visiablePicBeds.push(defaultPicbed)
    }
    return visiablePicBeds
  }

  /**
   * 获取可用的图床列表名称
   */
  public getVisiablePicBedNames(): string[] {
    const picBeds = this.getPicBeds()
    return picBeds
      .map((item: IPicBedType) => {
        if (item.visible) {
          return item.name
        }
        return null
      })
      .filter((item: any) => item) as string[]
  }

  /**
   * 根据图床数据获取可用的图床列表名称
   *
   * @param picBeds
   */
  public static getVisiablePicBedNamesByPicBeds(picBeds: IPicBedType[]): string[] {
    return picBeds
      .map((item: IPicBedType) => {
        if (item.visible) {
          return item.name
        }
        return null
      })
      .filter((item: any) => item) as string[]
  }

  /**
   * 获取当前图床
   */
  public getCurrentUploader() {
    return this.getPicgoConfig("picBed.uploader") || this.getPicgoConfig("picBed.current") || "smms"
  }

  public getUploaderConfigList(type: string): IUploaderConfigItem {
    if (!type) {
      return {
        configList: [] as IUploaderConfigListItem[],
        defaultId: "",
      }
    }
    const currentUploaderConfig = this.getPicgoConfig(`uploader.${type}`, {})
    let configList = currentUploaderConfig.configList
    let defaultId = currentUploaderConfig.defaultId || ""
    if (!configList) {
      const res = this.upgradeUploaderConfig(type)
      configList = res.configList
      defaultId = res.defaultId
    }

    const configItem = {
      configList,
      defaultId,
    }
    // console.warn("获取当前图床配置列表：", configItem)
    return configItem
  }

  /**
   * 选择当前图床
   *
   * @param type 当前图床类型
   * @param id 当前图床配置ID
   * @author terwer
   * @since 0.7.0
   */
  public selectUploaderConfig = (type: string, id: string) => {
    const { configList } = this.getUploaderConfigList(type)
    const config = configList.find((item: any) => item._id === id)
    if (config) {
      this.savePicgoConfig({
        [`uploader.${type}.defaultId`]: id,
        [`picBed.${type}`]: config,
      })
    }

    return config
  }

  /**
   * 设置默认图床
   *
   * @param type
   */
  public setDefaultPicBed(type: string) {
    this.savePicgoConfig({
      "picBed.current": type,
      "picBed.uploader": type,
    })
  }

  /**
   * get picbed config by type，获取的是表单属性详细信息
   *
   * it will trigger the uploader config function & get the uploader config result
   * & not just read from
   *
   * @author terwer
   * @since 0.7.0
   */
  public getPicBedConfig(type: string) {
    const name = this.ctx.helper.uploader.get(type)?.name || type
    if (this.ctx.helper.uploader.get(type)?.config) {
      const _config = this.ctx.helper.uploader.get(type).config(this.ctx)
      const config = handleConfigWithFunction(_config)
      return {
        config,
        name,
      }
    } else {
      return {
        config: [],
        name,
      }
    }
  }

  /**
   * 更新图床配置
   *
   * @param type 图床类型
   * @param id 图床配置ID
   * @param config 图床配置
   *
   * @author terwer
   * @since 0.7.0
   */
  public updateUploaderConfig(type: string, id: string, config: IUploaderConfigListItem) {
    // ensure raw for save
    config = getRawData(config)
    const uploaderConfig = this.getUploaderConfigList(type)
    let configList = uploaderConfig.configList
    // ensure raw for save
    configList = getRawData(configList)
    const defaultId = uploaderConfig.ddefaultId
    const existConfig = configList.find((item: IUploaderConfigListItem) => item._id === id)
    let updatedConfig
    let updatedDefaultId = defaultId
    if (existConfig) {
      updatedConfig = Object.assign(existConfig, trimValues(config), {
        _updatedAt: Date.now(),
      })
    } else {
      updatedConfig = this.completeUploaderMetaConfig(config)
      updatedDefaultId = updatedConfig._id
      configList.push(updatedConfig)
    }
    this.savePicgoConfig({
      [`uploader.${type}.configList`]: configList,
      [`uploader.${type}.defaultId`]: updatedDefaultId,
      [`picBed.${type}`]: updatedConfig,
    })
  }

  /**
   * delete uploader config by type & id
   */
  public deleteUploaderConfig(type: string, id: string) {
    const uploaderConfig = this.getUploaderConfigList(type)
    let configList = uploaderConfig.configList
    // ensure raw for save
    configList = getRawData(configList)
    const defaultId = uploaderConfig.ddefaultId
    if (configList.length <= 1) {
      return
    }
    let newDefaultId = defaultId
    const updatedConfigList = configList.filter((item: any) => item._id !== id)
    if (id === defaultId) {
      newDefaultId = updatedConfigList[0]._id
      this.changeCurrentUploader(type, updatedConfigList[0], updatedConfigList[0]._id)
    }
    this.savePicgoConfig({
      [`uploader.${type}.configList`]: updatedConfigList,
    })
    return {
      configList: updatedConfigList,
      defaultId: newDefaultId,
    }
  }

  // ===================================================================================================================

  /**
   * 切换当前上传图床
   *
   * @param type 图床类型
   * @param config 图床配置
   * @param id 配置id
   */
  private changeCurrentUploader(type: string, config: any, id: string) {
    if (!type) {
      return
    }
    if (id) {
      this.savePicgoConfig({
        [`uploader.${type}.defaultId`]: id,
      })
    }
    if (config) {
      this.savePicgoConfig({
        [`picBed.${type}`]: config,
      })
    }
    this.savePicgoConfig({
      "picBed.current": type,
      "picBed.uploader": type,
    })
  }

  /**
   * upgrade old uploader config to new format
   *
   * @param type type
   * @author terwer
   * @since 0.7.0
   */
  private upgradeUploaderConfig = (type: string) => {
    const uploaderConfig = this.getPicgoConfig(`picBed.${type}`, {})
    if (!uploaderConfig._id) {
      Object.assign(uploaderConfig, this.completeUploaderMetaConfig(uploaderConfig))
    }

    const uploaderConfigList = [uploaderConfig]
    this.savePicgoConfig({
      [`uploader.${type}`]: {
        configList: uploaderConfigList,
        defaultId: uploaderConfig._id,
      },
      [`picBed.${type}`]: uploaderConfig,
    })
    return {
      configList: uploaderConfigList as IUploaderConfigListItem[],
      defaultId: uploaderConfig._id as string,
    }
  }

  /**
   * 获取插件列表（PC only）
   */
  public getPluginList(): IPicGoPlugin[] {
    const path = win.require("path")

    const STORE_PATH = this.ctx.baseDir
    const pluginList = this.ctx.pluginLoader.getFullList()
    const list = [] as IPicGoPlugin[]
    for (const i in pluginList) {
      const plugin = this.ctx.pluginLoader.getPlugin(pluginList[i])!
      const pluginPath = path.join(STORE_PATH, `/node_modules/${pluginList[i]}`)
      const pluginPKG = win.require(path.join(pluginPath, "package.json"))

      const uploaderName = plugin.uploader || ""
      const transformerName = plugin.transformer || ""
      let menu: Omit<IGuiMenuItem, "handle">[] = []
      if (plugin.guiMenu) {
        menu = plugin.guiMenu(this.ctx).map((item: any) => ({
          label: item.label,
        }))
      }
      let gui = false
      if (pluginPKG.keywords && pluginPKG.keywords.length > 0) {
        if (pluginPKG.keywords.includes("picgo-gui-plugin")) {
          gui = true
        }
      }

      const obj: IPicGoPlugin = {
        name: handleStreamlinePluginName(pluginList[i]),
        fullName: pluginList[i],
        author: pluginPKG.author.name || pluginPKG.author,
        description: pluginPKG.description,
        logo: "file://" + path.join(pluginPath, "logo.png").split(path.sep).join("/"),
        version: pluginPKG.version,
        gui,
        config: {
          plugin: {
            fullName: pluginList[i],
            name: handleStreamlinePluginName(pluginList[i]),
            config: plugin.config ? handleConfigWithFunction(plugin.config(this.ctx)) : [],
          },
          uploader: {
            name: uploaderName,
            config: handleConfigWithFunction(this.getConfigByHelper(uploaderName, IPicGoHelperType.uploader)),
          },
          transformer: {
            name: transformerName,
            config: handleConfigWithFunction(this.getConfigByHelper(uploaderName, IPicGoHelperType.transformer)),
          },
        },
        enabled: this.getPicgoConfig(`picgoPlugins.${pluginList[i]}`, false),
        homepage: pluginPKG.homepage ? pluginPKG.homepage : "",
        guiMenu: menu,
        ing: false,
      }
      list.push(obj)
    }
    return list
  }

  /**
   * 构建插件菜单
   *
   * @param plugin 插件对象
   *
   * @author terwer
   * @since 0.7.0
   */
  public buildPluginMenu(plugin: IPicGoPlugin) {
    const that = this
    // 根据插件构造菜单
    const template = [] as any

    // 启用插件
    const enableItem = {
      // setting.picgo.plugin.enable
      label: "启用插件",
      enabled: !plugin.enabled,
      click() {
        that.savePicgoConfig({
          [`picgoPlugins.${plugin.fullName}`]: true,
        })
        that.triggerPicgoEvent(PicgoHelperEvents.REFRESH_PLUGIN_LIST)
      },
    }

    // 禁用插件
    const disableItem = {
      // setting.picgo.plugin.disable
      label: "禁用插件",
      enabled: plugin.enabled,
      click() {
        that.savePicgoConfig({
          [`picgoPlugins.${plugin.fullName}`]: false,
        })

        if (plugin.config.transformer.name) {
          that.handleRestoreState("transformer", plugin.config.transformer.name)
        }
        if (plugin.config.uploader.name) {
          that.handleRestoreState("uploader", plugin.config.uploader.name)
        }
        that.triggerPicgoEvent(PicgoHelperEvents.REFRESH_PLUGIN_LIST)
      },
    }

    // 卸载插件菜单
    const uninstallItem = {
      //
      label: "卸载插件",
      click() {
        // 卸载中事件
        that.triggerPicgoEvent(PicgoHelperEvents.HANDLE_PLUGIN_ING, plugin.fullName)
        // 卸载插件
        that
          .uninstallPlugin(plugin.fullName)
          .then((res: any) => {
            // 处理卸载事件
            that.triggerPicgoEvent(PicgoHelperEvents.HANDLE_PLUGIN_UNINSTALLED, {
              success: res.success,
              body: res.body,
              errMsg: res.success ? "" : res.body,
            })
          })
          .catch((e: any) => {
            const errMsg = e.toString()
            // 处理卸载事件
            that.triggerPicgoEvent(PicgoHelperEvents.HANDLE_PLUGIN_UNINSTALLED, {
              success: false,
              body: errMsg,
              errMsg: errMsg,
            })
          })
      },
    }

    // 更新插件
    const updateItem = {
      // setting.picgo.plugin.update
      label: "更新插件",
      click() {
        // 更新中事件
        that.triggerPicgoEvent(PicgoHelperEvents.HANDLE_PLUGIN_ING, plugin.fullName)
        // 更新插件
        that
          .updatelugin(plugin.fullName)
          .then((res: any) => {
            // 处理卸载事件
            that.triggerPicgoEvent(PicgoHelperEvents.HANDLE_PLUGIN_UPDATED, {
              success: res.success,
              body: res.body,
              errMsg: res.success ? "" : res.body,
            })
          })
          .catch((e: any) => {
            const errMsg = e.toString()
            // 处理更新事件
            that.triggerPicgoEvent(PicgoHelperEvents.HANDLE_PLUGIN_UPDATED, {
              success: false,
              body: errMsg,
              errMsg: errMsg,
            })
          })
      },
    }

    // 固定菜单
    template.push(enableItem)
    template.push(disableItem)
    template.push(uninstallItem)
    template.push(updateItem)

    // 插件自定义菜单配置
    const pluginMenuTemplate = []
    for (const i in plugin.config) {
      // 图床分多份单独配置
      if (i !== "uploader") {
        if (plugin.config[i].config.length > 0) {
          const obj = {
            // setting.picgo.plugin.config.setting
            // label: `插件设置 - ${plugin.config[i].fullName || plugin.config[i].name}`,
            label: "插件设置",
            click() {
              const currentType = i
              const configName = plugin.config[i].fullName || plugin.config[i].name
              const config = plugin.config[i].config
              // 触发事件操作插件配置
              that.triggerPicgoEvent(PicgoHelperEvents.DO_PICGO_CONFIG_PLUGIN, {
                currentType: currentType,
                configName: configName,
                config: config,
              })
            },
          }
          pluginMenuTemplate.push(obj)
        }
      }
    }

    // 如果没有插件菜单不显示分割线
    if (pluginMenuTemplate.length > 0) {
      template.push({
        label: " -------- ",
        enabled: false,
        click() {
          // ignore
        },
      })

      for (const pluginMenuItem of pluginMenuTemplate) {
        template.push(pluginMenuItem)
      }
    }

    // 显示菜单
    const { Menu, getCurrentWindow } = win.require("@electron/remote")
    const elecWin = getCurrentWindow()
    const menu = Menu.buildFromTemplate(template)
    menu.popup({
      elecWin,
    })
  }

  /**
   * 安装插件
   *
   * @param fullName
   */
  public async installPlugin(fullName: string) {
    const res = await this.ctx.pluginHandler.install([fullName], {}, {})
    return {
      success: res.success,
      body: fullName,
      errMsg: res.success ? "" : res.body,
    }
  }

  /**
   * 卸载插件
   *
   * @param fullName
   */
  public async uninstallPlugin(fullName: string) {
    const res = await this.ctx.pluginHandler.uninstall([fullName])
    return {
      success: res.success,
      body: fullName,
      errMsg: res.success ? "" : res.body,
    }
  }

  /**
   * 更新插件
   *
   * @param fullName
   */
  public async updatelugin(fullName: string) {
    const res = await this.ctx.pluginHandler.update([fullName], {}, {})
    return {
      success: res.success,
      body: fullName,
      errMsg: res.success ? "" : res.body,
    }
  }

  /**
   * restore Uploader & Transformer
   *
   * @param item 插件项
   * @param name 名称
   */
  public handleRestoreState(item: string, name: string) {
    if (item === "uploader") {
      const current = this.getPicgoConfig("picBed.current")
      if (current === name) {
        this.savePicgoConfig({
          "picBed.current": "github",
          "picBed.uploader": "github",
        })
      }
    }
    if (item === "transformer") {
      const current = this.getPicgoConfig("picBed.transformer")
      if (current === name) {
        this.savePicgoConfig({
          "picBed.transformer": "path",
        })
      }
    }
  }

  public async importPlugin() {
    const { dialog, getCurrentWindow } = win.require("@electron/remote")
    const res = await dialog.showOpenDialog(getCurrentWindow(), {
      properties: ["openDirectory"],
    })
    const filePaths = res.filePaths

    if (filePaths.length > 0) {
      const res = await this.ctx.pluginHandler.install(filePaths, {}, {})
      if (res.success) {
        this.triggerPicgoEvent(PicgoHelperEvents.REFRESH_PLUGIN_LIST)
      } else {
        throw new Error("导入插件失败，请检查picgo.log，错误信息：" + res.body)
      }
    }
  }
  // ===================================================================================================================

  /**
   * 增加配置元数据
   *
   * @param originData 原始数据
   */
  private completeUploaderMetaConfig(originData: any) {
    return Object.assign(
      {
        _configName: "Default",
      },
      trimValues(originData),
      {
        _id: IdUtil.newUuid(),
        _createdAt: Date.now(),
        _updatedAt: Date.now(),
      }
    )
  }

  // get uploader or transformer config
  private getConfigByHelper(name: string, type: IPicGoHelperType) {
    let config: any[] = []
    if (name === "") {
      return config
    } else {
      const handler = this.ctx.helper[type].get(name)
      if (handler) {
        if (handler.config) {
          config = handler.config(this.ctx)
        }
      }
      return config
    }
  }
}

export { PicgoHelper, PicgoHelperEvents }
