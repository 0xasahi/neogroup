import React from 'react';
import {Group} from '../../components/Card'
import './style.scss';

function GroupHome (props) {
    const {last_topics, is_member, group} = props;
    console.log(props.last_topics);

    return (
        <div className='group'>
            <Group {...group} is_member={is_member} />
            <span className='group-description'>
                {/* ({user.mastodon_account.username} · {updated_at}) */}
            </span>


            <div className="topics">
                <div className="latest-talk">
                    最近讨论
                </div>
                <table>
                    <tbody>
                            <tr>
                                <th className='topic-title'>
                                    讨论
                                </th>
                                <th className='topic-author'>作者</th>
                                <th className='topic-time'>最后回应</th>

                            </tr>                   
                        {
                            last_topics.map((topic) => {
                                return (
                                    <tr>
                                        <td className='topic-title'>
                                            <a href={`/group/topic/${topic.id}`}>
                                                {topic.title}
                                            </a>
                                        </td>
                                        <td className='topic-author'>
                                            <a href={`/user/${topic.user.id}`}>
                                                {topic.user.mastodon_account.acct}
                                            </a>
                                        </td>
                                        <td className='topic-time'>
                                            {topic.updated_at}
                                        </td>
                                    </tr>
                                );
                            })
                        }


                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default GroupHome;
