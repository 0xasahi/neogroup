# 开篇

NeoGroup，灵感来源于 NeoDB，NeoDB 里几乎涵盖了豆瓣全部的书影音功能，但是唯独缺少了小组和同城功能，作为这两个功能的重度使用者，决定做点什么，所以也模仿 NeoDB，开发了一个基于 Mastodon 登录的去中心化小组产品

# TODO

- [ ] i18n
- [ ] 首页增加关注的用户的发布的帖子

## 前端 Dev

使用了 [django-react-templatetags](https://github.com/Frojd/django-react-templatetags) 提供的 django 插件进行前后端（伪）分离渲染，源文件在 `/static_source` 目录，编译至 `/common/static/react/` 文件夹。开发前首先确保安装了 node.js 和 yarn ，然后从根目录执行以下命令：

```bash
cd static_source
yarn
yarn dev
```

以上执行均无问题的话（执行过程可能 OOM 需要[手动设置一下](https://stackoverflow.com/questions/48387040/how-do-i-determine-the-correct-max-old-space-size-for-node-js) ），就可以开始开发啦~

---

### 以新建一个 `Nav` 导航栏组件为例

首先在 `static_source/src/components/` 下新建一个 `Nav.jsx` 文件（ 样式可写在同目录下的 style.scss 里 import ）：

https://github.com/anig1scur/neogroup/blob/style/static_source/src/components/Nav/index.jsx


然后在 [App](https://github.com/anig1scur/neogroup/blob/style/static_source/src/App.jsx) 这里对外导出。


确保 `{% load react %}` 以后可以在 django 模板中使用[如下语句](https://github.com/anig1scur/neogroup/blob/582b697f9ffe0f8fb1d69702c450f5423841cef6/group/templates/group/react_base.html#L28)进行一个组件的渲染：

```html

{% react_render component="Nav" %}

```

也可以[传 props ](https://github.com/anig1scur/neogroup/blob/style/group/templates/group/react_topic.html#L12) 到组件中，更多使用请看 [django-react-templatetags](https://github.com/Frojd/django-react-templatetags)

