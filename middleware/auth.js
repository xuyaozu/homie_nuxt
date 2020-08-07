// authLevel : 2  没有权限无法访问 需要通过cookie验证
// authLevel : 1  根据user参数展示页面部分内容
// authLevel : 0  该页面不需要权限

import { UserApi } from '~/apis'
import { getUid, getRefreshToken, removeStore, setStore } from '~/utils'

export default async ({ route, store, redirect }) => {
  const { authLevel } = route.meta.pop()
  switch (authLevel) {
    case 0:
      break
    case 1: {
      const user = route.params.name
      const userInfo = await UserApi.getUser(user)
      // no that user
      if (!userInfo) {
        redirect({ path: '/login' })
      }
      const res = await UserApi.checkAuth(userInfo._id)
      // user login so grant previlage
      if (res.statusCode === 200) {
        store.commit('USER_STATE', res.user)
        break
      } else if (res.expire) {
        setStore('access_token', res.access_token)
        store.commit('USER_STATE', res.user)
        break
      }
      // no login so set state isLogin = false
      store.commit('USER_STATE', res.user, false)
      removeStore('access_token')
      break
    }
    case 2: {
      const uid = getUid()
      const refreshToken = getRefreshToken()
      // no login
      if (!uid || !refreshToken) {
        removeStore('access_token')
        redirect({ path: '/login' })
      }
      const res = await UserApi.checkAuth(uid)
      // auth succeed
      if (res.statusCode === 200) {
        store.commit('USER_STATE', res.user)
        break
      }
      // auth failed due to token expired
      // so update access_token
      else if (res.expire) {
        setStore('access_token', res.access_token)
        store.commit('USER_STATE', res.user)
        break
      }
      // auth failed due to invalid token
      // so redirect to login
      removeStore('access_token')
      redirect({ path: '/login' })
    }
  }
}
