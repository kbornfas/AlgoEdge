"use strict";(()=>{var e={};e.id=2,e.ids=[2],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},61282:e=>{e.exports=require("child_process")},84770:e=>{e.exports=require("crypto")},80665:e=>{e.exports=require("dns")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},98216:e=>{e.exports=require("net")},19801:e=>{e.exports=require("os")},55315:e=>{e.exports=require("path")},76162:e=>{e.exports=require("stream")},82452:e=>{e.exports=require("tls")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},13143:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>w,patchFetch:()=>v,requestAsyncStorage:()=>x,routeModule:()=>g,serverHooks:()=>f,staticGenerationAsyncStorage:()=>y});var i={};t.r(i),t.d(i,{POST:()=>h});var o=t(49303),a=t(88716),s=t(60670),n=t(87070),l=t(20728),p=t(95456),d=t(20471),u=t(91585),c=t(26033);let m=u.Ry({username:u.Z_().min(3).max(50),email:u.Z_().email(),password:u.Z_().min(8),fullName:u.Z_().optional(),phone:u.Z_().optional(),country:u.Z_().optional()});async function h(e){try{let r=await e.json(),t=m.parse(r),i=await l._.user.findFirst({where:{OR:[{email:t.email},{username:t.username}]}});if(i)return n.NextResponse.json({error:i.email===t.email?"Email already registered":"Username already taken"},{status:400});let o=await (0,p.c_)(t.password),a=(0,p.VV)(),s=new Date(Date.now()+864e5),u=await l._.user.create({data:{username:t.username,email:t.email,passwordHash:o,fullName:t.fullName,phone:t.phone,country:t.country,verificationToken:a,verificationExpires:s}});await l._.subscription.create({data:{userId:u.id,plan:"free",status:"active"}}),await l._.userSettings.create({data:{userId:u.id}});try{await (0,d.zk)(u.email,u.username,a)}catch(e){console.error("Failed to send verification email:",e)}let c=(0,p.RA)({userId:u.id,email:u.email,username:u.username});return n.NextResponse.json({message:"Registration successful. Please check your email to verify your account.",token:c,user:{id:u.id,username:u.username,email:u.email,isVerified:u.isVerified}},{status:201})}catch(e){if(console.error("Registration error:",e),e instanceof c.jm)return n.NextResponse.json({error:"Invalid input data",details:e.errors},{status:400});return n.NextResponse.json({error:"Registration failed. Please try again."},{status:500})}}let g=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/auth/register/route",pathname:"/api/auth/register",filename:"route",bundlePath:"app/api/auth/register/route"},resolvedPagePath:"/home/runner/work/AlgoEdge/AlgoEdge/src/app/api/auth/register/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:x,staticGenerationAsyncStorage:y,serverHooks:f}=g,w="/api/auth/register/route";function v(){return(0,s.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:y})}},95456:(e,r,t)=>{t.d(r,{Oe:()=>u,RA:()=>l,VV:()=>c,WX:()=>p,c_:()=>d});var i=t(41482),o=t.n(i),a=t(42023),s=t.n(a);let n=process.env.JWT_SECRET||"your-secret-key-change-in-production";function l(e){return o().sign(e,n,{expiresIn:"7d"})}function p(e){try{return o().verify(e,n)}catch(e){return null}}async function d(e){let r=await s().genSalt(12);return s().hash(e,r)}async function u(e,r){return s().compare(e,r)}function c(e=32){let r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t="";for(let i=0;i<e;i++)t+=r.charAt(Math.floor(Math.random()*r.length));return t}},20471:(e,r,t)=>{t.d(r,{LS:()=>s,zk:()=>a});let i=t(55245).createTransport({host:process.env.SMTP_HOST||"smtp.gmail.com",port:parseInt(process.env.SMTP_PORT||"587"),secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});async function o(e){try{await i.sendMail({from:process.env.SMTP_FROM||"AlgoEdge <noreply@algoedge.com>",to:e.to,subject:e.subject,html:e.html,text:e.text||e.html.replace(/<[^>]*>/g,"")}),console.log(`✅ Email sent to ${e.to}`)}catch(e){throw console.error("❌ Error sending email:",e),Error("Failed to send email")}}async function a(e,r,t){let i=`${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${t}`,a=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AlgoEdge!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #3B82F6; margin-top: 0;">Hi ${r}!</h2>
          <p>Thank you for registering with AlgoEdge. Please verify your email address to get started with automated trading.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${i}" style="display: inline-block; background: #3B82F6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link into your browser:</p>
          <p style="color: #3B82F6; word-break: break-all; font-size: 14px;">${i}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't create an account, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;await o({to:e,subject:"Verify Your AlgoEdge Account",html:a})}async function s(e,r,t){let i=`${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${t}`,a=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #3B82F6; margin-top: 0;">Hi ${r}!</h2>
          <p>We received a request to reset your AlgoEdge account password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${i}" style="display: inline-block; background: #3B82F6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link into your browser:</p>
          <p style="color: #3B82F6; word-break: break-all; font-size: 14px;">${i}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      </body>
    </html>
  `;await o({to:e,subject:"Reset Your AlgoEdge Password",html:a})}},20728:(e,r,t)=>{t.d(r,{_:()=>o});let i=require("@prisma/client"),o=global.prisma||new i.PrismaClient({log:["error"]})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),i=r.X(0,[948,972,944,585,245],()=>t(13143));module.exports=i})();