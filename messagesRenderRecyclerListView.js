import React, {useRef, useMemo, useCallback} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {toJS, computed} from 'mobx';
import {observer} from 'mobx-react-lite';
import {RecyclerListView, DataProvider, LayoutProvider} from 'recyclerlistview';
import Feather from 'react-native-vector-icons/Feather';
import {useChatStore} from '../store/chatStoreProvider';
import {UserContextProvider} from '../../user/userHook';
import {generateItems} from './messageBrainer';
import {useMessagesRenderHook} from './messagesRenderHook';

const styles = StyleSheet.create({
  scrollHelper: {
    height: 33,
    width: 33,
    backgroundColor: '#1D1E26',
    borderRadius: 50,
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 2,
    margin: 15,
    marginRight: 13,
    elevation: 10,
    justifyContent: 'center',
  },
  scrollHelperIcon: {
    alignSelf: 'center',
  },
});

const MessagesRenderRecyclerListView = observer(props => {
  const {chatStore} = useChatStore();
  const forwardRef = useRef();
  const {
    renderPropsMemo,
    scroller,
    renderMessage,
    handleOnScroll,
    getMoreMessages,
    renderListEmptyComponent,
    setMessagesRendererRef,
  } = useMessagesRenderHook(props);
  const messagesMemo = useMemo(() => {
    // https://github.com/mobxjs/mobx/discussions/3348#discussioncomment-2470109
    return computed(() =>
      generateItems({
        data: toJS(chatStore.messages),
        inRoom: toJS(chatStore?.allInCurrentRoomDetails),
        isDiscussionRoom: chatStore?.isDiscussionRoom,
      }),
    );
  }, []).get();

  const layoutProvider = useRef(
    new LayoutProvider(
      () => 0,
      () => {},
    ),
  ).current;

  const dataProvider = useMemo(
    () => dataProviderMaker(messagesMemo),
    [messagesMemo],
  );

  const renderItem = useCallback((type, data) => {
    return renderMessage({message: data});
  }, []);

  const scrollToBottom = () => {
    if (forwardRef && forwardRef.current) {
      forwardRef.current.scrollToOffset({offset: 0, animated: true});
    }
  };

  const ToRenderLayer =
    renderPropsMemo.useUserContextProvider === false
      ? View
      : UserContextProvider;

  return (
    <ToRenderLayer>
      {!messagesMemo.length ? (
        renderListEmptyComponent({invert: true})
      ) : (
        <RecyclerListView
          ref={setMessagesRendererRef}
          style={{
            flex: 1,
            paddingTop: 20,
            paddingBottom: 20,
            transform: [{scaleY: -1}],
          }}
          isHorizontal={false}
          layoutProvider={layoutProvider}
          dataProvider={dataProvider}
          forceNonDeterministicRendering={true}
          canChangeSize={true}
          onEndReachedThreshold={0.5}
          rowRenderer={renderItem}
          onEndReached={getMoreMessages}
          onScroll={handleOnScroll}
        />
      )}

      {chatStore.showScrollHelper === true && (
        <TouchableOpacity style={styles.scrollHelper} onPress={scrollToBottom}>
          <Feather
            name="chevrons-down"
            size={19}
            color="white"
            style={styles.scrollHelperIcon}
          />
        </TouchableOpacity>
      )}
      {scroller()}
    </ToRenderLayer>
  );
});

const dataProviderMaker = data =>
  new DataProvider((r1, r2) => {
    return r1 !== r2;
  }).cloneWithRows(data);

export default React.memo(MessagesRenderRecyclerListView);
