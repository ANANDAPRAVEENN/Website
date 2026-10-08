const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/enquiry');
const valid={firstName:'Demo',lastName:'Reviewer',email:'review@example.com',phone:'',service:'LiDAR Processing',message:'Please review this sample LiDAR enquiry.',website:''};
async function call({body=valid,method='POST',origin='https://example.com',key='01234567-89ab-cdef-0123-456789abcdef'}={}) {
  let code,payload;const headers={};
  await handler({method,body,headers:{host:'example.com',origin,'content-type':'application/json','idempotency-key':key}}, {setHeader:(k,v)=>headers[k]=v,status:n=>{code=n;return {json:x=>{payload=x;}};}});
  return {code,payload,headers};
}
test('enquiry endpoint rejects invalid requests and only confirms accepted provider delivery',async()=>{
  delete process.env.RESEND_API_KEY;delete process.env.ENQUIRY_FROM;
  assert.equal((await call({method:'GET'})).code,405);
  assert.equal((await call({origin:'https://unrelated.example'})).code,403);
  assert.equal((await call({body:{...valid,email:'not-an-email'}})).code,400);
  assert.equal((await call({body:{...valid,website:'bot'}})).code,400);
  assert.equal((await call({body:{...valid,message:'x'.repeat(4001)}})).code,400);
  assert.equal((await call({body:{...valid,email:['wrong type']}})).code,400);
  assert.equal((await call()).code,503);
  process.env.RESEND_API_KEY='test-placeholder';process.env.ENQUIRY_FROM='demo@example.com';
  const original=global.fetch;let calls=0;
  global.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.resend.com/emails');const b=JSON.parse(options.body);assert.equal(b.reply_to,valid.email);assert.equal(b.to[0],'info@geoinformatics.co.in');assert.ok(options.headers['Idempotency-Key']);return {ok:true,json:async()=>({id:'mock-delivery'})};};
  assert.deepEqual((await call()).payload,{accepted:true});assert.equal(calls,1);
  global.fetch=async()=>({ok:false});assert.equal((await call()).code,502);
  global.fetch=async()=>{throw new Error('network')};assert.equal((await call()).code,502);
  global.fetch=original;delete process.env.RESEND_API_KEY;delete process.env.ENQUIRY_FROM;
});
