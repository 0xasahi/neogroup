import React from 'react';
import Author from '../Author';
import Like from '../Like';
import Quote from '../Quote';
import axiosInstance from '../../common/axios';

import './style.scss';

export const ReplyIcon = (props) => {
    return <svg {...props} width="24px" height="24px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-reply-fill">
        <path d="M5.921 11.9 1.353 8.62a.719.719 0 0 1 0-1.238L5.921 4.1A.716.716 0 0 1 7 4.719V6c1.5 0 6 0 7 8-2.5-4.5-7-4-7-4v1.281c0 .56-.606.898-1.079.62z" />
    </svg>
}

function Comment (props) {
    const {id, user, created_at, content, liked, like_count, onReply, comment_reply, is_owner} = props;

    const deleteComment = async () => {
        await axiosInstance.post(`/group/comment/${id}/delete`,
        ).then((res) => {
            if (res.status == 200 && res.data && res.data.r === 0) {
                document.getElementById(`comment-${id}`).remove();
            }
            else {
                if (res.status != 200) {
                    alert("出错了，请联系管理员");
                }
                else {
                    alert(res.data.msg);
                }
            }
        })
    }

    const onDelete = () => {
        if (confirm("确定要删除这条评论吗？")) {
            deleteComment();
        }
    }

    return (
        <div className='comment' id={`comment-${id}`}>
            <Author {...user} authored_at={created_at} />
            <div className='comment-content'>
                {
                    comment_reply &&
                    <Quote comment={comment_reply} />
                }
                <div className='comment-text p'>
                    {content}
                </div>
            </div>
            <div className='comment-action'>
                <Like targetId={id} liked={liked} likeCount={like_count} />
                <div className='reply' onClick={() => onReply(props)} onTouchStart={() => onReply(props)} >
                    <ReplyIcon />
                </div>
                {is_owner &&
                    <div className='delete' onClick={onDelete} onTouchStart={onDelete}>
                        删除
                    </div>}
            </div>
        </div>
    );
}

export default Comment;
