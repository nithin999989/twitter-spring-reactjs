import React, {ChangeEvent, FC, ReactElement, useEffect, useState} from 'react';
import {Button, Dialog, DialogContent, DialogTitle} from "@material-ui/core";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import {useUnsentTweetsModalStyles} from "./UnsentTweetsModalStyles";
import {TweetApi} from "../../../services/api/tweetApi";
import AddTweetForm from "../AddTweetForm";
import CloseButton from "../../CloseButton/CloseButton";
import Spinner from "../../Spinner/Spinner";
import {TweetResponse} from "../../../store/types/tweet";
import UnsentTweetItem from "./UnsentTweetItem/UnsentTweetItem";
import EmptyPageDescription from "../../EmptyPageDescription/EmptyPageDescription";
import {useDispatch, useSelector} from "react-redux";
import {fetchUnsentTweets, resetUnsentTweets} from "../../../store/ducks/unsentTweets/actionCreators";
import {
    selectIstUnsentTweetsLoading,
    selectUnsentTweets,
    selectUnsentTweetsPagesCount
} from "../../../store/ducks/unsentTweets/selectors";
import InfiniteScrollWrapper from "../../InfiniteScrollWrapper/InfiniteScrollWrapper";

interface UnsentTweetsModalProps {
    visible?: boolean;
    onClose: () => void;
}

const UnsentTweetsModal: FC<UnsentTweetsModalProps> = ({visible, onClose}): ReactElement | null => {
    const dispatch = useDispatch();
    const unsentTweets = useSelector(selectUnsentTweets);
    const isUnsentTweetsLoading = useSelector(selectIstUnsentTweetsLoading);
    const pagesCount = useSelector(selectUnsentTweetsPagesCount);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [unsentTweet, setUnsentTweet] = useState<TweetResponse | null>(null);
    const [visibleEditTweetModal, setVisibleEditTweetModal] = useState<boolean>(false);
    const [visibleEditListFooter, setVisibleEditListFooter] = useState<boolean>(false);
    const [checkboxIndexes, setCheckboxIndexes] = useState<number[]>([]);
    const classes = useUnsentTweetsModalStyles({visibleEditTweetModal});

    useEffect(() => {
        if (visible) {
            loadUnsentTweets(0);
        }

        return () => {
            dispatch(resetUnsentTweets());
        };
    }, [visible, visibleEditTweetModal]);

    const handleChangeTab = (event: ChangeEvent<{}>, newValue: number): void => {
        setActiveTab(newValue);
    };

    const loadUnsentTweets = (page: number): void => {
        dispatch(fetchUnsentTweets(page));
    }

    const onOpenEditTweetModal = (tweet: TweetResponse): void => {
        if (!visibleEditListFooter) {
            setUnsentTweet(tweet);
            setVisibleEditTweetModal(true);
        } else {
            onToggleCheckTweet(tweet.id);
        }
    };

    const onCloseEditTweetModal = (): void => {
        setUnsentTweet(null);
        setVisibleEditTweetModal(false);
    };

    const onToggleCheckTweet = (tweetId: number): void => {
        const currentIndex = checkboxIndexes.findIndex((checkboxIndex) => checkboxIndex === tweetId) !== -1;

        if (currentIndex) {
            setCheckboxIndexes(checkboxIndexes.filter((checkboxIndex) => (checkboxIndex !== tweetId)));
        } else {
            setCheckboxIndexes([...checkboxIndexes, tweetId]);
        }
    };

    const isTweetSelected = (tweetId: number): boolean => {
        return checkboxIndexes.findIndex((checkboxIndex) => checkboxIndex === tweetId) !== -1;
    };

    const onOpenEditTweetList = (): void => {
        setVisibleEditListFooter(true);
    };

    const onCloseEditTweetList = (): void => {
        setVisibleEditListFooter(false);
        setCheckboxIndexes([]);
    };

    const onSelectAllTweets = (): void => {
        setCheckboxIndexes([...unsentTweets.map(tweet => tweet.id)]);
    };

    const onDeselectAllTweets = (): void => {
        setCheckboxIndexes([]);
    };

    const handleDeleteScheduledTweets = (): void => {
        if (checkboxIndexes.length !== 0) {
            TweetApi.deleteScheduledTweets({tweetsIds: checkboxIndexes.map(value => Number(value))})
                .then(() => dispatch(fetchUnsentTweets(0)));
            setCheckboxIndexes([]);
            setVisibleEditListFooter(false);
        }
    };

    if (!visible) {
        return null;
    }

    return (
        <Dialog className={classes.dialog} transitionDuration={0} open={visible} onClose={onClose}>
            <DialogTitle>
                <CloseButton onClose={!visibleEditTweetModal ? onClose : onCloseEditTweetModal}/>
                {!visibleEditTweetModal && "Unsent Tweets"}
                {visibleEditTweetModal ? (
                    <Button
                        className={classes.outlinedButton}
                        onClick={onCloseEditTweetModal}
                        type="submit"
                        variant="text"
                        color="primary"
                    >
                        Unsent Tweets
                    </Button>
                ) : (
                    <Button
                        onClick={visibleEditListFooter ? onCloseEditTweetList : onOpenEditTweetList}
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="small"
                    >
                        {visibleEditListFooter ? "Done" : "Edit"}
                    </Button>
                )}
            </DialogTitle>
            {(!visibleEditTweetModal) ? (
                <>
                    <DialogContent id="scrollableDiv" className={classes.content}>
                        <div className={classes.tabs}>
                            <Tabs value={activeTab} indicatorColor="primary" textColor="primary" onChange={handleChangeTab}>
                                <Tab className={classes.tab} label="Scheduled"/>
                                <Tab className={classes.tab} label="Drafts"/>
                            </Tabs>
                        </div>
                        <InfiniteScrollWrapper
                            dataLength={unsentTweets.length}
                            pagesCount={pagesCount}
                            loadItems={loadUnsentTweets}
                        >
                            {isUnsentTweetsLoading && !unsentTweets.length ? (
                                <Spinner/>
                            ) : (
                                (!isUnsentTweetsLoading && !unsentTweets.length) ? (
                                    <EmptyPageDescription
                                        title={`You don’t have any ${activeTab === 0 ? "scheduled" : "unsent"} Tweets`}
                                        subtitle={"When you do, you’ll find them here."}
                                    />
                                ) : (
                                    <>
                                        {unsentTweets.map((tweet) => (
                                            <UnsentTweetItem
                                                key={tweet.id}
                                                tweet={tweet}
                                                onOpenEditTweetModal={onOpenEditTweetModal}
                                                onToggleCheckTweet={onToggleCheckTweet}
                                                isTweetSelected={isTweetSelected}
                                                visibleEditListFooter={visibleEditListFooter}
                                            />
                                        ))}
                                        {isUnsentTweetsLoading && <Spinner/>}
                                    </>
                                )
                            )}
                        </InfiniteScrollWrapper>
                    </DialogContent>
                    <>
                        {visibleEditListFooter && (
                            <div id={"editListFooter"} className={classes.footer}>
                                <Button
                                    onClick={(checkboxIndexes.length === 0) ? onSelectAllTweets : onDeselectAllTweets}
                                    type="submit"
                                    variant="text"
                                    color="primary"
                                    size="small"
                                >
                                    {(checkboxIndexes.length === 0) ? "Select All" : "Deselect All"}
                                </Button>
                                <Button
                                    className={classes.footerDeleteButton}
                                    onClick={handleDeleteScheduledTweets}
                                    disabled={checkboxIndexes.length === 0}
                                    type="submit"
                                    variant="text"
                                    color="primary"
                                    size="small"
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </>
                </>
            ) : (
                <DialogContent className={classes.content}>
                    <div className={classes.addTweetWrapper}>
                        <AddTweetForm
                            unsentTweet={unsentTweet!}
                            minRows={3}
                            title={"What's happening?"}
                            buttonName={"Schedule"}
                            onCloseModal={onCloseEditTweetModal}
                        />
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
};

export default UnsentTweetsModal;
