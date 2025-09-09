/**
 * @file 请求模块，基于 axios 封装，带统一的响应拦截和错误处理
 */
import axios from 'axios';
import { message } from 'antd';


const instance = axios.create({
  // baseURL: '/api', // 如果所有接口都有统一前缀，可以这样设置
  timeout: 10000, // 请求超时时间
});

/**
 * 响应拦截器
 * @description 用于统一处理响应数据和错误
 */
instance.interceptors.response.use(
  /**
   * 成功回调
   * @param response - 成功的响应对象
   * @returns 直接返回响应体中的 data 部分
   */
  (response) => response,
  /**
   * 失败回调
   * @param error - 错误对象
   * @returns 返回一个被拒绝的 Promise，并根据错误类型显示提示信息
   */
  (error) => {
    // 1. 网络错误（服务器未响应、DNS错误、断网等）
    if (!error.response) {
      message.error('网络异常，无法连接到服务器，请检查您的网络或稍后再试。');
      return Promise.reject({ type: 'NETWORK_ERROR', msg: '服务器未响应' });
    }

    // 2. HTTP 错误（服务器返回了 4xx 或 5xx 状态码）
    const { status, data } = error.response;
    switch (status) {
      case 400:
        message.error(data?.detail || '请求参数不正确，请检查后重试。');
        break;
      case 422: {
        // FastAPI 的 Pydantic 数据验证错误
        const firstError = Array.isArray(data.detail) ? data.detail[0] : null;
        const errorMsg = firstError?.msg || '提交的数据格式不正确。';
        message.error(errorMsg);
        break;
      }
      case 500:
        console.log('网络无法连接');
        message.error('服务器内部发生错误，请联系管理员或稍后再试。');
        break;
      default:
        message.error(`发生未知错误，状态码：${status}`);
    }
    return Promise.reject({ type: 'HTTP_ERROR', status, data });
  }
);

export default instance;