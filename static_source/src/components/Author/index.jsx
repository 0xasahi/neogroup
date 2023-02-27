import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import './style.scss';
import {getTimeDiffStr} from '../../common/utils';

function Author (props) {
    const {mastodon_site, mastodon_account, authored_at, showNote=false} = props;
    const {
        acct,
        display_name,
        avatar,
        note,
        url,
        username
    } = mastodon_account;

    const mastodon_site_account = `${acct}@${mastodon_site}`;
    return (
        <div className='author'>
            <div className='left-side'>
                <a href={`/group/profile/${mastodon_site_account}/`} className='topic-author' >
                    <img className="avatar" src={avatar} title={`${username}@${mastodon_site}`} />
                </a>
            </div>
            <div className='right-side'>
                <div className='topic-user' alt={mastodon_site_account}>
                    <div className="topic-user-username">
                        <span className="display-name"> {display_name} </span>
                        {/* 来自:&nbsp; */}
                        <a href={url}  >
                            <span class='mastodon-account'>{mastodon_site_account}</span>
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
                    {getTimeDiffStr(new Date(authored_at), new Date())}
                </div>
            </div>
        </div >
    )
        ;
}

export default Author;
