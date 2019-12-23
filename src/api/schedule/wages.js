import request from '@/utils/request'
export function listWages(query) {
  return request({
    url: '/system/wages/list',
    method: 'get',
    params: query
  })
}

export function monthList() {
  return request({
    url: '/system/wages/monthList',
    method: 'get',
  })
}

export function sendWagesByIds(ids) {
  return request({
    url: '/system/wages/sendWagesByIds/'+ids,
    method: 'post',
  })
}
// 修改工资
export function wagesEdit(data) {
  return request({
    url: '/system/user/wagesEdit',
    method: 'put',
    data: data
  })
}


// 修改工资
export function getListWages(data) {
  return request({
    url: '/system/wages/getListWages',
    method: 'get',
    params: data
  })
}
