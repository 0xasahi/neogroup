import './style.scss';
import React, {forwardRef, useEffect, useState} from 'react';
import Quote from '../Quote';
import axiosInstance from '../../common/axios';
import {FediIcon, SendIcon} from '../../common/utils';


const ReplyForm = forwardRef((props, ref) => {
    const {topicId} = props;
    const [replyState, setReplyState] = useState({
        sending: false,
        share_to_mastodon: true,
        quote: props.replyComment,
    });

    useEffect(() => {
        setReplyState({
            ...replyState,
            quote: props.replyComment,
        })
    }, [props.replyComment]);


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
        let content = ref.current && ref.current.querySelector('[contentEditable]').innerText.replaceAll('\n\n', '\n');
        if (!content) {
            alert('请输入一段文字再提交吧');
            return
        }
        postComment({
            id: topicId,
            content: content,
            comment_reply: replyState.quote?.id,
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
                replyState.quote && <Quote comment={replyState.quote} />
            }
            <div className='reply-content' contentEditable placeholder='Neogrp 欢迎文明、友善的交流。' onKeyDown={(e) => {
                if (e.currentTarget.textContent === '' && (e.key === 'Backspace' || e.key === 'Delete')) {
                    setReplyState(
                        {
                            ...replyState,
                            quote: null,
                        }
                    )
                }
            }} />
            <div className={`reply-action${replyState.sending ? ' disabled' : ''}`} disabled={replyState.sending} >
                <div className={`share-to-mastodon${replyState.share_to_mastodon ? ' yes' : ''}`} onClick={toggleShareToMastodon} >
                    <FediIcon />
                </div>
                <div className='submit' onClick={onSubmit} >
                    <SendIcon />
                </div>
            </div>
        </div>
    );
});

export default ReplyForm;
