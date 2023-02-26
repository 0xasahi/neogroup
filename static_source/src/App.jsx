import Topic from './components/Topic';
import Nav from './components/Nav';
import TopicSidebar from './components/Sidebar/Topic';
import withHypernova from "./common/withHypernova";
import {isBrowser} from './common/utils';

const clientExport = {
    Topic: withHypernova('Topic')(Topic),
    Nav: withHypernova('Nav')(Nav),
    TopicSidebar
}

const serverExport = {
    Topic,
    Nav,
    TopicSidebar
}

export default isBrowser() ? clientExport : serverExport;
