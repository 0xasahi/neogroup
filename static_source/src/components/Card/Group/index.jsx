import React, {useState} from 'react';
import './style.scss';
import axiosInstance from '../../../common/axios';


function GroupCard (props) {
    const [joinState, setJoinState] = useState(props.is_member)
    const {
        created_at,
        description,
        icon_url,
        id,
        name,
        updated_at,
        user,
        absolute_url,
    } = props;

    return (
        <div className='group-card'>
            <div className="group-card-hd">
                <div className='group-info'>
                    <a className="group-avatar" href={absolute_url} >
                        <img src={
                            (icon_url && ('/media/' + icon_url)) || '/static/img/logo_blue.png'
                        } />
                    </a>
                    <div className="group-base">
                        <div className="group-name">
                            {name}
                        </div>
                        <div className='group-owner'>
                            <a href={user.mastodon_account.url} > {user.mastodon_account.display_name} </a>
                            <br />
                            创建于：{created_at.slice(0, 10)}
                        </div>
                    </div>

                </div>
                <div className='group-join-button button' onClick={async () => {
                    const action = joinState ? 'leave' : 'join'
                    if (action == 'leave') {
                        if (!window.confirm('确定要退出该小组吗？')) {
                            return
                        }
                    }
                    await axiosInstance.post(`/group/${id}/${action}`).then((res) => {
                        if (res.data.r == 0) {
                            setJoinState(!joinState)
                        }
                        else {
                            alert(res.data.msg || "出错了，请联系管理员")
                        }
                    }).catch((err) => {
                        if (err.response && err.response.status === 403) {
                            alert("请先登录");
                        }
                    })
                }
                }>
                    {
                        joinState ? '已加入' : '加入'
                    }
                </div>
            </div>

            <div className='group-card-bd'>
                <span>
                    简介
                </span>
                <div className='group-description p'>
                    {description}
                </div>
            </div>
        </div>
    );
}

export default GroupCard;
