"use strict";(()=>{var e={};e.id=436,e.ids=[436],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},61282:e=>{e.exports=require("child_process")},84770:e=>{e.exports=require("crypto")},80665:e=>{e.exports=require("dns")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},98216:e=>{e.exports=require("net")},19801:e=>{e.exports=require("os")},55315:e=>{e.exports=require("path")},76162:e=>{e.exports=require("stream")},82452:e=>{e.exports=require("tls")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},18486:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>v,patchFetch:()=>b,requestAsyncStorage:()=>f,routeModule:()=>m,serverHooks:()=>w,staticGenerationAsyncStorage:()=>y});var s={};t.r(s),t.d(s,{POST:()=>g});var o=t(49303),i=t(88716),a=t(60670),n=t(87070),l=t(20728),p=t(95456),d=t(20471),u=t(91585),c=t(26033);let h=u.Ry({email:u.Z_().email()}),x=u.Ry({token:u.Z_(),password:u.Z_().min(8)});async function g(e){try{let r=await e.json();if("token"in r&&"password"in r){let e=x.parse(r),t=await l._.user.findFirst({where:{resetToken:e.token,resetExpires:{gt:new Date}}});if(!t)return n.NextResponse.json({error:"Invalid or expired reset token"},{status:400});let s=await (0,p.c_)(e.password);return await l._.user.update({where:{id:t.id},data:{passwordHash:s,resetToken:null,resetExpires:null}}),n.NextResponse.json({message:"Password reset successfully"})}{let e=h.parse(r),t=await l._.user.findUnique({where:{email:e.email}});if(!t)return n.NextResponse.json({message:"If the email exists, a password reset link has been sent."});let s=(0,p.VV)(),o=new Date(Date.now()+36e5);await l._.user.update({where:{id:t.id},data:{resetToken:s,resetExpires:o}});try{await (0,d.LS)(t.email,t.username,s)}catch(e){console.error("Failed to send reset email:",e)}return n.NextResponse.json({message:"If the email exists, a password reset link has been sent."})}}catch(e){if(console.error("Password reset error:",e),e instanceof c.jm)return n.NextResponse.json({error:"Invalid input data",details:e.errors},{status:400});return n.NextResponse.json({error:"Password reset failed. Please try again."},{status:500})}}let m=new o.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/auth/reset-password/route",pathname:"/api/auth/reset-password",filename:"route",bundlePath:"app/api/auth/reset-password/route"},resolvedPagePath:"/home/runner/work/AlgoEdge/AlgoEdge/src/app/api/auth/reset-password/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:f,staticGenerationAsyncStorage:y,serverHooks:w}=m,v="/api/auth/reset-password/route";function b(){return(0,a.patchFetch)({serverHooks:w,staticGenerationAsyncStorage:y})}},95456:(e,r,t)=>{t.d(r,{Oe:()=>x,RA:()=>u,VV:()=>g,WX:()=>c,c_:()=>h});var s=t(41482),o=t.n(s),i=t(42023),a=t.n(i),n=t(84770),l=t.n(n);let p=process.env.JWT_SECRET;p||console.warn("⚠️  JWT_SECRET not set. Using development fallback. DO NOT use in production!");let d=p||"dev-only-secret-DO-NOT-USE-IN-PRODUCTION";function u(e){return o().sign(e,d,{expiresIn:"7d"})}function c(e){try{return o().verify(e,d)}catch(e){return null}}async function h(e){let r=await a().genSalt(12);return a().hash(e,r)}async function x(e,r){return a().compare(e,r)}function g(e=32){return l().randomBytes(e).toString("hex")}},20471:(e,r,t)=>{t.d(r,{LS:()=>a,zk:()=>i});let s=t(55245).createTransport({host:process.env.SMTP_HOST||"smtp.gmail.com",port:parseInt(process.env.SMTP_PORT||"587"),secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});async function o(e){try{await s.sendMail({from:process.env.SMTP_FROM||"AlgoEdge <noreply@algoedge.com>",to:e.to,subject:e.subject,html:e.html,text:e.text||e.html.replace(/<[^>]*>/g,"")}),console.log(`✅ Email sent to ${e.to}`)}catch(e){throw console.error("❌ Error sending email:",e),Error("Failed to send email")}}async function i(e,r,t){let s=`${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${t}`,i=`
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
            <a href="${s}" style="display: inline-block; background: #3B82F6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link into your browser:</p>
          <p style="color: #3B82F6; word-break: break-all; font-size: 14px;">${s}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't create an account, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;await o({to:e,subject:"Verify Your AlgoEdge Account",html:i})}async function a(e,r,t){let s=`${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${t}`,i=`
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
            <a href="${s}" style="display: inline-block; background: #3B82F6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link into your browser:</p>
          <p style="color: #3B82F6; word-break: break-all; font-size: 14px;">${s}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      </body>
    </html>
  `;await o({to:e,subject:"Reset Your AlgoEdge Password",html:i})}},20728:(e,r,t)=>{t.d(r,{_:()=>o});let s=require("@prisma/client"),o=global.prisma||new s.PrismaClient({log:["error"]})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[948,972,944,585,245],()=>t(18486));module.exports=s})();