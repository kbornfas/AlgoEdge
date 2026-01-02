"use strict";(()=>{var e={};e.id=9436,e.ids=[9436],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},61282:e=>{e.exports=require("child_process")},84770:e=>{e.exports=require("crypto")},80665:e=>{e.exports=require("dns")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},98216:e=>{e.exports=require("net")},19801:e=>{e.exports=require("os")},55315:e=>{e.exports=require("path")},76162:e=>{e.exports=require("stream")},82452:e=>{e.exports=require("tls")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},18486:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>v,patchFetch:()=>b,requestAsyncStorage:()=>f,routeModule:()=>m,serverHooks:()=>y,staticGenerationAsyncStorage:()=>w});var s={};r.r(s),r.d(s,{POST:()=>g});var o=r(49303),i=r(88716),n=r(60670),a=r(87070),p=r(20728),l=r(95456),d=r(20471),u=r(91585),c=r(26033);let x=u.Ry({email:u.Z_().email()}),h=u.Ry({token:u.Z_(),password:u.Z_().min(8)});async function g(e){try{let t=await e.json();if("token"in t&&"password"in t){let e=h.parse(t),r=await p._.user.findFirst({where:{resetToken:e.token,resetExpires:{gt:new Date}}});if(!r)return a.NextResponse.json({error:"Invalid or expired reset token"},{status:400});let s=await (0,l.c_)(e.password);return await p._.user.update({where:{id:r.id},data:{passwordHash:s,resetToken:null,resetExpires:null}}),a.NextResponse.json({message:"Password reset successfully"})}{let e=x.parse(t),r=await p._.user.findUnique({where:{email:e.email}});if(!r)return a.NextResponse.json({message:"If the email exists, a password reset link has been sent."});let s=(0,l.VV)(),o=new Date(Date.now()+36e5);await p._.user.update({where:{id:r.id},data:{resetToken:s,resetExpires:o}});try{await (0,d.LS)(r.email,r.username,s)}catch(e){console.error("Failed to send reset email:",e)}return a.NextResponse.json({message:"If the email exists, a password reset link has been sent."})}}catch(e){if(console.error("Password reset error:",e),e instanceof c.jm)return a.NextResponse.json({error:"Invalid input data",details:e.errors},{status:400});return a.NextResponse.json({error:"Password reset failed. Please try again."},{status:500})}}let m=new o.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/auth/reset-password/route",pathname:"/api/auth/reset-password",filename:"route",bundlePath:"app/api/auth/reset-password/route"},resolvedPagePath:"/home/runner/work/AlgoEdge/AlgoEdge/src/app/api/auth/reset-password/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:f,staticGenerationAsyncStorage:w,serverHooks:y}=m,v="/api/auth/reset-password/route";function b(){return(0,n.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:w})}},95456:(e,t,r)=>{r.d(t,{Oe:()=>f,RA:()=>h,VV:()=>w,WX:()=>g,Z9:()=>u,c_:()=>m,cq:()=>l,f:()=>y,sk:()=>d});var s=r(41482),o=r.n(s),i=r(42023),n=r.n(i),a=r(84770),p=r.n(a);let l=6,d=15,u=8,c=process.env.JWT_SECRET;c||console.warn("⚠️  JWT_SECRET not set. Using development fallback. DO NOT use in production!");let x=c||"dev-only-secret-DO-NOT-USE-IN-PRODUCTION";function h(e){return o().sign(e,x,{expiresIn:"7d"})}function g(e){try{return o().verify(e,x)}catch(e){return null}}async function m(e){let t=await n().genSalt(12);return n().hash(e,t)}async function f(e,t){return n().compare(e,t)}function w(e=32){return p().randomBytes(e).toString("hex")}function y(e=6){let t=Math.pow(10,e-1);return(t+p().randomBytes(4).readUInt32BE(0)%(Math.pow(10,e)-1-t+1)).toString()}},20471:(e,t,r)=>{r.d(t,{LS:()=>i,a2:()=>n});let s=r(55245).createTransport({host:process.env.SMTP_HOST||"smtp.gmail.com",port:parseInt(process.env.SMTP_PORT||"587"),secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});async function o(e){try{await s.sendMail({from:process.env.SMTP_FROM||"AlgoEdge <noreply@algoedge.com>",to:e.to,subject:e.subject,html:e.html,text:e.text||e.html.replace(/<[^>]*>/g,"")}),console.log(`✅ Email sent to ${e.to}`)}catch(e){throw console.error("❌ Error sending email:",e),Error("Failed to send email")}}async function i(e,t,r){let s=`${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${r}`,i=`
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
          <h2 style="color: #3B82F6; margin-top: 0;">Hi ${t}!</h2>
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
  `;await o({to:e,subject:"Reset Your AlgoEdge Password",html:i})}async function n(e,t,r){let s=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #3B82F6; margin-top: 0;">Hi ${t}!</h2>
          <p>Thank you for registering with AlgoEdge. Please use the verification code below to complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 8px; border: 2px solid #3B82F6;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3B82F6;">${r}</span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">Enter this code in the verification page to continue.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This code will expire in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't create an account, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;await o({to:e,subject:"Your AlgoEdge Verification Code",html:s})}},20728:(e,t,r)=>{r.d(t,{_:()=>o});let s=require("@prisma/client"),o=global.prisma||new s.PrismaClient({log:["error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[8948,5972,6944,1585,5245],()=>r(18486));module.exports=s})();