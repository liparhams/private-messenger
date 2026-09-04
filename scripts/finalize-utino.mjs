import fs from 'node:fs';
const file='app/messenger/ChatWorkspace.js';
if(fs.existsSync(file)){
 let s=fs.readFileSync(file,'utf8');
 const marker='{groupOpen && <Modal onClose={() => { setGroupOpen(false); setGroupSelection([]); }} title={t.create}>';
 const modal=`{channelOpen&&<Modal onClose={()=>setChannelOpen(false)} title="ساخت کانال"><div className="uc-channel-form"><label>نام کانال<input value={channelName} onChange={e=>setChannelName(e.target.value)} maxLength={80}/></label><label>شناسه عمومی<input dir="ltr" value={channelUsername} onChange={e=>setChannelUsername(e.target.value.replace(/[^a-z0-9_]/gi,"").toLowerCase())} maxLength={32} placeholder="mychannel"/></label><label>توضیحات<textarea value={channelDescription} onChange={e=>setChannelDescription(e.target.value)} maxLength={500}/></label><label className="uc-channel-check"><input type="checkbox" checked={channelPublic} onChange={e=>setChannelPublic(e.target.checked)}/> کانال عمومی و قابل جستجو</label><div className="uc-modal-actions"><button type="button" onClick={()=>setChannelOpen(false)}>لغو</button><button type="button" className="primary" disabled={busy||!channelName.trim()} onClick={createChannel}>ساخت کانال</button></div></div></Modal>}`;
 if(!s.includes('title="ساخت کانال"') && s.includes(marker)) s=s.replace(marker,modal+marker);
 fs.writeFileSync(file,s);
}
function rename(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory()){if(!['.git','node_modules','.next','out'].includes(e.name))rename(p)}else if(/\.(js|jsx|ts|tsx|json|css|md|html|yml|yaml)$/.test(e.name)){const s=fs.readFileSync(p,'utf8'),n=s.replaceAll('Utino Chat v1','UTINOCHATV1').replaceAll('Utino Chat','UTINOCHATV1');if(n!==s)fs.writeFileSync(p,n)}}}
rename('.');
