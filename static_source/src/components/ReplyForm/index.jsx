import React, {useState} from 'react';
import './style.scss';
import axiosInstance from '../../common/axios';
import Quote from '../Quote';

export const FediIcon = () => {
    return <svg width="26px" height="26px" viewBox="-10 -5 1034 1034" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1">
        <title>分享到联邦宇宙</title>
        <path d="M539 176q-32 0 -55 22t-25 55t20.5 58t56 27t58.5 -20.5t27 -56t-20.5 -59t-56.5 -26.5h-5zM452 271l-232 118q20 20 25 48l231 -118q-19 -20 -24 -48zM619 298q-13 25 -38 38l183 184q13 -25 39 -38zM477 320l-135 265l40 40l143 -280q-28 -5 -48 -25zM581 336
 q-22 11 -46 10l-8 -1l21 132l56 9zM155 370q-32 0 -55 22.5t-25 55t20.5 58t56.5 27t59 -21t26.5 -56t-21 -58.5t-55.5 -27h-6zM245 438q1 9 1 18q-1 19 -10 35l132 21l26 -50zM470 474l-26 51l311 49q-1 -8 -1 -17q1 -19 10 -36zM842 480q-32 1 -55 23t-24.5 55t21 58
 t56 27t58.5 -20.5t27 -56.5t-20.5 -59t-56.5 -27h-6zM236 493q-13 25 -39 38l210 210l51 -25zM196 531q-21 11 -44 10l-9 -1l40 256q21 -10 45 -9l8 1zM560 553l48 311q21 -10 44 -9l10 1l-46 -294zM755 576l-118 60l8 56l135 -68q-20 -20 -25 -48zM781 625l-119 231
 q28 5 48 25l119 -231q-28 -5 -48 -25zM306 654l-68 134q28 5 48 25l60 -119zM568 671l-281 143q19 20 24 48l265 -135zM513 771l-51 25l106 107q13 -25 39 -38zM222 795q-32 0 -55.5 22.5t-25 55t21 57.5t56 27t58.5 -20.5t27 -56t-20.5 -58.5t-56.5 -27h-5zM311 863
 q2 9 1 18q-1 19 -9 35l256 41q-1 -9 -1 -18q1 -18 10 -35zM646 863q-32 0 -55 22.5t-24.5 55t20.5 58t56 27t59 -21t27 -56t-20.5 -58.5t-56.5 -27h-6z" />
    </svg>
}


export const SendIcon = (props) => {
    return <svg {...props} width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>send</title>
        <g id="send-Regular">
            <path id="send-Regular-2" data-name="send-Regular" class="cls-1" d="M20.927,3.073a2.782,2.782,0,0,0-2.663-.738L5.151,5.614A3.83,3.83,0,0,0,5.2,13.058l4.646,1.093L10.942,18.8a3.773,3.773,0,0,0,3.7,2.953h.028a3.773,3.773,0,0,0,3.714-2.9L21.665,5.735A2.781,2.781,0,0,0,20.927,3.073Zm-.718,2.3L16.931,18.484a2.3,2.3,0,0,1-2.277,1.766,2.274,2.274,0,0,1-2.252-1.8l-1.1-4.69L15.53,9.53a.75.75,0,0,0-1.06-1.06L10.237,12.7l-4.69-1.1a2.33,2.33,0,0,1-.031-4.529L18.628,3.791a1.313,1.313,0,0,1,.321-.04,1.3,1.3,0,0,1,1.26,1.621Z" />
        </g>
    </svg>
}


const ReplyForm = React.forwardRef((props, ref) => {
    const {replyComment, topicId} = props;
    const [replyState, setReplyState] = useState({
        sending: false,
        share_to_mastodon: true,
    });

    const postComment = async (params) => {
        setReplyState({
            ...replyState,
            sending: true,
        });
        await axiosInstance.post(`/group/topic/${topicId}/`, params,
        ).then((res) => {
            setReplyState({
                ...replyState,
                sending: false,
            });

            if (res.status == 200) {
                if (res.data.r === 0) {
                    location.reload();
                }
                else {
                    alert(res.data.msg);
                }
            }
            else {
                alert('出错啦，请稍后再试或联系管理员');
            }
        })
    }

    const onSubmit = () => {
        let content = ref.current.querySelector('[contentEditable]').value;
        if (!content) {
            alert('请输入一段文字再提交吧');
            return
        }
        postComment({
            id: topicId,
            content: content,
            comment_reply: replyComment?.id,
            share_to_mastodon: replyState.share_to_mastodon,
        });
    }

    const toggleShareToMastodon = () => {
        setReplyState({
            ...replyState,
            share_to_mastodon: !replyState.share_to_mastodon
        })
    }

    return (
        <div className='reply-form' ref={ref}>
            {
                replyComment && <Quote comment={replyComment} />
            }
            <div className='reply-content'>
                <div className='reply-content' contentEditable placeholder='Neogrp 欢迎文明、友善的交流。' />
            </div>
            <div className={`reply-action${replyState.sending ? ' disabled' : ''}`} disabled={replyState.sending} >
                <div className={`share-to-mastodon${replyState.share_to_mastodon ? ' yes' : ''}`} onClick={toggleShareToMastodon} ><FediIcon /></div>
                <div className='submit' onClick={onSubmit} >
                    <SendIcon />
                </div>
            </div>
        </div>
    );
});

export default ReplyForm;
