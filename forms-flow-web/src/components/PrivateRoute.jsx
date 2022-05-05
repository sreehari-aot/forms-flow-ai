import React, {useEffect, Suspense, lazy} from "react";
import {Route, Switch, Redirect} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";

import UserService from "../services/UserService";
import {setUserAuth} from "../actions/bpmActions";
import {CLIENT, STAFF_REVIEWER} from "../constants/constants";

import Loading from "../containers/Loading";
import NotFound from "./NotFound";
import { setTenantFromId } from "../apiManager/services/tenantServices";


const Form = lazy(() => import('./Form'));
const ServiceFlow = lazy(() => import('./ServiceFlow'));
const DashboardPage = lazy(() => import("./Dashboard"));
const InsightsPage = lazy(() => import("./Insights"));
const Application = lazy(() => import("./Application"));
const Admin = lazy(() => import("./Admin"))

const PrivateRoute = React.memo((props) => {
  const dispatch = useDispatch();
  const isAuth = useSelector((state) => state.user.isAuthenticated);
  const userRoles = useSelector((state) => state.user.roles || []);
  const tenant = useSelector((state) => state.tenants.tenantDetail);
  const tenantKey = useSelector((state) => state.tenants.tenantId);

  // useEffect(() => {
  //   if (props.store) {
  //     UserService.initKeycloak(props.store, (err, res) => {
  //       dispatch(setUserAuth(res.authenticated));
  //     });
  //   }
  // }, [props.store, dispatch]);

  useEffect(()=>{
    let url = window.location.search
    url = new URLSearchParams(url)
    const tenantKey = url.get("tenantKey")
    if(tenantKey){
      let tenatFromSession = sessionStorage.getItem("tenantKey")
      if(tenatFromSession !== tenantKey){
          sessionStorage.setItem("tenantKey", tenantKey)
          dispatch(setTenantFromId(tenantKey))
      }
    }else{
      if (props.store) {
            UserService.initKeycloak(props.store, (err, res) => {
              dispatch(setUserAuth(res.authenticated));
          });
      }
    }
  },[props.store, dispatch])


  useEffect(()=>{
    if(tenant && tenantKey){
      if(UserService.KeycloakData){
        UserService.initKeycloak(props.store, tenantKey, (err, res) => {
          dispatch(setUserAuth(res.authenticated));
        });
      }else{
        UserService.setKeycloakJson(tenantKey,()=>{
          UserService.initKeycloak(props.store, tenantKey, (err, res) => {
            dispatch(setUserAuth(res.authenticated));
          });
        })
      }
    }
  },[dispatch, tenant, tenantKey, props.store]);

  const ReviewerRoute = ({component: Component, ...rest}) => (
    <Route
      {...rest}
      render={(props) =>
        userRoles.includes(STAFF_REVIEWER) ? (
          <Component {...props} />
        ) : (
          <Redirect exact to="/"/>
        )
      }
    />
  );

  const ClientReviewerRoute = ({component: Component, ...rest}) => (
    <Route
      {...rest}
      render={(props) =>
        userRoles.includes(STAFF_REVIEWER) || userRoles.includes(CLIENT) ? (
          <Component {...props} />
        ) : (
          <Redirect exact to="/"/>
        )
      }
    />
  );

  return (
    <>
      {isAuth ? (
        <Suspense fallback={<Loading/>}>
          <Switch>
            <Route path="/form" component={Form}/>
            <Route path="/admin" component={Admin}/>
            <Route path="/formflow" component={Form}/>
            <ClientReviewerRoute path="/application" component={Application}/>
            <ReviewerRoute path="/metrics" component={DashboardPage}/>
            <ReviewerRoute path="/task" component={ServiceFlow}/>
            <ReviewerRoute path="/insights" component={InsightsPage}/>
            <Route exact path="/">
              <Redirect to={userRoles.includes(STAFF_REVIEWER) ? '/task' : '/form'}/>
            </Route>
            <Route path='/404' exact={true} component={NotFound}/>
            <Redirect from='*' to='/404'/>
          </Switch>
        </Suspense>
      ) : (
        <Loading/>
      )}
    </>
  );
})

export default PrivateRoute;
