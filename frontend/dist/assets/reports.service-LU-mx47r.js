import{c as e,s as t}from"./index-D1juk-2-.js";/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n={name:"chart-column",size:24,node:[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]],aliases:["bar-chart-3"]};n.node;const r=e(n),o={organizerAnalytics:a=>t.get(`/organizer/events/${a}/analytics`),organizer:a=>o.organizerAnalytics(a),adminMacro:a=>t.get("/admin/analytics/macro",{query:a}),noShow:a=>t.get("/admin/analytics/no-show-violations",{query:a}),exportMacro:a=>t.get("/admin/analytics/macro/export",{query:a}),textToInsight:a=>t.post("/ai/admin/text-to-insight",{cau_hoi_tu_nhien:a,prompt:a}),generateEventContent:a=>t.post("/ai/organizer/generate-content",a)};export{r as C,o as r};
