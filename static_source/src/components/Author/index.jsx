import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import './style.scss';
import {getDisplayDate} from '../../common/utils';

function Author (props) {
    const {mastodon_username, mastodon_account, authored_at, showNote = false} = props;
    const {
        display_name,
        avatar,
        note,
        url,
    } = mastodon_account;

    return (
        <div className='author'>
            <div className='left-side'>
                <a href={`/group/profile/${mastodon_username}/`} className='topic-author' >
                    <img className="avatar" src={avatar} />
                </a>
            </div>
            <div className='right-side'>
                <div className='topic-user' alt={mastodon_username}>
                    <div className="topic-user-username">
                        <span className="display-name"> {display_name} </span>
                        <a class='mastodon-account'href={`/group/profile/${mastodon_username}/`}>
                            {mastodon_username}
                        </a>

                    </div>
                    {showNote && note && <div
                        className='note'
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(note)
                        }}
                    />}
                </div>
                <div className='authored-at' alt={authored_at} title={authored_at}>
                    {getDisplayDate(new Date(authored_at), new Date())}
                </div>
            </div>
        </div >
    )
        ;
}

export default Author;
