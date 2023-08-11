/*
 * Copyright (c) 2023, Terwer . All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Terwer designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Terwer in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Terwer, Shenzhen, Guangdong, China, youweics@163.com
 * or visit www.terwer.space if you need additional information or have any
 * questions.
 */

import { reactive } from "vue"
import { ImageItem } from "~/src/models/imageItem.ts"
import { isDev } from "~/common/Constants.ts"
import { createAppLogger } from "~/common/appLogger.ts"
import { useSiyuanDevice } from "~/src/composables/useSiyuanDevice.ts"

/**
 * Picgo公共组件
 *
 * @author terwer
 * @since 0.6.1
 */
export const usePicgoCommon = () => {
  // private data
  const logger = createAppLogger("picgo-common")
  const { isInSiyuanOrSiyuanNewWin } = useSiyuanDevice()

  // public data
  const picgoCommonData = reactive({
    isUploadLoading: false,
    popWidth: 400,
    showDebugMsg: isDev,
    loggerMsg: "",
    isSiyuanOrSiyuanNewWin: isInSiyuanOrSiyuanNewWin(),
    fileList: {
      files: <ImageItem[]>[],
    },
  })

  // public methods
  const picgoCommonMethods = {
    getPicgoCommonData: () => {
      return picgoCommonData
    },
  }

  return {
    picgoCommonData,
    picgoCommonMethods,
  }
}
