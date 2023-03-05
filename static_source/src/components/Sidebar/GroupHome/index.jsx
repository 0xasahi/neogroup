import './style.scss';
import React from 'react';

function GroupSidebar (props) {
    const {last_join_users, operations} = props;
    const accounts = last_join_users.map(u => u.user.mastodon_account);

    return (
        <div className='sidebar'>
            <span className='sidebar-title'> 最近加入</span>
            <div className='latest-join'>
                {
                    accounts ? accounts.map((account) =>
                        <a href={account.url} className='account'>
                            <img src={account.avatar} className='account-avatar' />
                            <div className='account-name'>
                                {account.display_name}
                            </div>
                        </a>) : '这里冷清清的'
                }
            </div>
            {operations ? (
                <div className='operations'>
                    {
                        operations.map(o => <a className='operation' href={o[0]}> {o[1]} </a>
                        )
                    }
                </div>
            ) : null}
        </div >
    );
}

export default GroupSidebar;
