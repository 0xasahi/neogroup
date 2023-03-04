import React,{useState} from 'react';
import './style.scss';
import axiosInstance from '../../../common/axios';


function GroupCard (props) {
    const [joinState, setJoinState] = useState(props.is_member)
    console.log(props)
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
                            创建于  {created_at} · 创建者<strong class='user-id'>{user.mastodon_account.acct}</strong>
                            <span class='user-mastodon_site'>@{user.mastodon_site}</span>
                        </div>
                    </div>

                </div>
                <div className='group-join-button' onClick={async()=>{
                    const action=joinState?'leave':'join'
                    if(action=='leave'){
                        if(!window.confirm('确定要退出该群组吗？')){
                            return
                        }
                    }
              

                    await axiosInstance.post(`/group/${id}/${action}`).then((res)=>{
                        if(res.data.r==0){

                            setJoinState(!joinState)

                        }
                        else{
                            alert(res.data.msg)
                        }

                    })}

            }>
                    {
                        joinState?'已加入':'加入'
                    }
                </div>
            </div>

            <div className='group-card-bd'>
             
             
            <span>
            简介
            </span>
                <div className='group-description'>
                    {description}
                </div>
            </div>
        </div>
    );
}

export default GroupCard;
