import {AxiosResponse} from "axios";
import {call, put, takeLatest} from 'redux-saga/effects';

import {
    AcceptFollowerRequestActionInterface,
    DeclineFollowerRequestActionInterface,
    FetchFollowerRequestsActionInterface,
    FollowerRequestsActionsType
} from "./contracts/actionTypes";
import {processFollowRequest, setFollowerRequests, setFollowerRequestsLoadingState} from "./actionCreators";
import {LoadingStatus} from "../../types";
import {FollowerUserResponse} from "../../types/user";
import {UserApi} from "../../../services/api/userApi";
import {setFollowersSize, setUserLoadingStatus} from "../user/actionCreators";

export function* fetchFollowRequests({payload}: FetchFollowerRequestsActionInterface) {
    try {
        yield put(setFollowerRequestsLoadingState(LoadingStatus.LOADING));
        const response: AxiosResponse<FollowerUserResponse[]> = yield call(UserApi.getFollowerRequests, payload);
        yield put(setFollowerRequests({
            items: response.data,
            pagesCount: parseInt(response.headers["page-total-count"])
        }));
    } catch (error) {
        yield put(setFollowerRequestsLoadingState(LoadingStatus.ERROR));
    }
}

export function* acceptFollowRequests({payload}: AcceptFollowerRequestActionInterface) {
    try {
        yield put(setUserLoadingStatus(LoadingStatus.LOADING));
        yield call(UserApi.acceptFollowRequest, payload);
        yield put(setFollowersSize());
        yield put(processFollowRequest(payload));
    } catch (error) {
        yield put(setUserLoadingStatus(LoadingStatus.ERROR));
    }
}

export function* declineFollowRequests({payload}: DeclineFollowerRequestActionInterface) {
    try {
        yield put(setUserLoadingStatus(LoadingStatus.LOADING));
        yield call(UserApi.declineFollowRequest, payload);
        yield put(processFollowRequest(payload));
    } catch (error) {
        yield put(setUserLoadingStatus(LoadingStatus.ERROR));
    }
}

export function* fetchFollowerSaga() {
    yield takeLatest(FollowerRequestsActionsType.FETCH_FOLLOWER_REQUESTS, fetchFollowRequests);
    yield takeLatest(FollowerRequestsActionsType.ACCEPT_FOLLOW_REQUEST, acceptFollowRequests);
    yield takeLatest(FollowerRequestsActionsType.DECLINE_FOLLOW_REQUEST, declineFollowRequests);
}
