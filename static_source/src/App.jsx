import Topic from './components/Topic';
import Nav from './components/Nav';
import TopicSidebar from './components/Sidebar/Topic';
import withHypernova from "./common/withHypernova";
import wrapInAppContainer from "./common/wrapInBaseContainer";
import {isBrowser} from './common/utils';

const clientExport = {
    Topic: withHypernova('Topic')(wrapInAppContainer(Topic)),
    Nav,
    TopicSidebar
}

const serverExport = {
    Topic,
    Nav,
    TopicSidebar
}

module.exports = isBrowser() ? clientExport : serverExport;
