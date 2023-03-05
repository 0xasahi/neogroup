import './style.scss';
import React, {useState, useRef} from 'react';
import {Group} from '../../components/Card';
import axiosInstance from '../../common/axios';
import Pagination from '../../components/Pagination';
import {getDisplayDate, useIsomorphicLayoutEffect} from '../../common/utils';


const Bubble = ({number}) => {
    const fontSize = 14 - number.toString().length * 2;
    return <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4 2H20C21.1 2 22 2.9 22 4V16C22 17.1 21.1 18 20 18H6L2 22V4C2 2.9 2.9 2 4 2ZM5.17 16H20V4H4V17.17L5.17 16Z" fill="#6a5c89" />
        <text x="48%" y="46%" dominant-baseline="middle" text-anchor="middle" font-size={fontSize} fill="#6a5c89">{number}</text>
    </svg>

}

function GroupHome (props) {
    const {is_member, group, last_topics} = props;
    const [topics, setTopics] = useState(last_topics || []);
    const [page, setPage] = useState(props.page);

    const firstUpdate = useRef(true);
    useIsomorphicLayoutEffect(() => {
        if (firstUpdate.current) {
            firstUpdate.current = false;
        } else {
            fetchTopics();
            window.history.pushState(null, null, `?page=${page}`);
        }
    }, [page]);

    const fetchTopics = async () => {
        await axiosInstance.get(`/group/${group.id}/topics`, {
            params: {
                page: page,
            }
        }).then((res) => {
            if (res.status == 200) {
                if (res.data.r === 0) {
                    setTopics(res.data.data);
                    window.scroll(0, document.querySelector('.topics').offsetTop - 100, {
                        behavior: 'smooth'
                    });
                }
                else {
                    alert(res.data.msg);
                }
            }
        })
    }

    return (
        <div className='group'>
            <Group {...group} is_member={is_member} />
            <div className='divide' />
            <div className="topics">
                <div className="topics-hd">
                    <div className="topics-hd-label">
                        最近讨论
                    </div>
                    <a className="topics-hd-add button" href={`/group/${group.id}/new_topic`}>发言</a>
                </div>
                <table>
                    <tbody>
                        <tr>
                            <th width="60%" className='topic-title'>讨论</th>
                            <th width="20%">作者</th>
                            <th width="20%">最后回应</th>
                        </tr>
                        {
                            topics.map((topic) => (
                                <tr>
                                    <td className='topic-title'>
                                        <Bubble number={topic.comments_count} />
                                        <a href={`/group/topic/${topic.id}`}>
                                            {topic.title}
                                        </a>
                                    </td>
                                    <td className='topic-author'>
                                        <a href={`/group/profile/${topic.user.mastodon_username}/`}>
                                            {topic.user.mastodon_account.display_name}
                                        </a>
                                    </td>
                                    <td className='topic-time' title={topic.updated_at}>
                                        {getDisplayDate(new Date(topic.updated_at), new Date(), true)}
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                <Pagination
                    current={page}
                    total={props.total}
                    pageSize={props.page_size}
                    onChange={(page) => setPage(page)}
                />
            </div>
        </div>
    );
}

export default GroupHome;
