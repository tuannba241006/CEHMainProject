import{c as a,v as o}from"./index-CHVKG1os.js";/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n={name:"download",size:24,node:[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]]};n.node;const d=a(n),c={list:(e,t)=>o.get(`/events/${e}/drl`,{query:t}),lock:e=>o.post(`/events/${e}/drl/lock`),unlock:(e,t)=>o.post(`/events/${e}/drl/unlock`,{ly_do:t}),export:e=>o.get(`/events/${e}/drl/export`)};export{d as D,c as d};
