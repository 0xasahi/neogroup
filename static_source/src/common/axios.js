import axios from 'axios';
import Cookie from 'js-cookie';

axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
axios.defaults.xsrfCookieName = "csrftoken";

const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    'X-CSRFTOKEN': Cookie.get('csrftoken'),
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
