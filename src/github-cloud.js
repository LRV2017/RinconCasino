const API="https://api.github.com";
const TOKEN_KEY="rincon.github.token.v1";
const GIST_KEY="rincon.github.gist.v1";
const SAVE_FILE="rincon-casino-save.json";
const HEADERS={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
export class GitHubCloudSave{
  constructor(){
    this.token=sessionStorage.getItem(TOKEN_KEY)||"";
    this.user=null;this.gistId=localStorage.getItem(GIST_KEY)||"";
  }
  async request(path,options={}){
    if(!this.token)throw new Error("Connect your GitHub account first.");
    const response=await fetch(API+path,{...options,headers:{...HEADERS,"Authorization":"Bearer "+this.token,...(options.headers||{})}});
    let data={};try{data=await response.json();}catch{}
    if(!response.ok){const error=new Error(data.message||("GitHub API request failed ("+response.status+")."));error.status=response.status;throw error;}
    return data;
  }
  async signIn(token){
    const value=String(token||"").trim();
    if(value.length<20)throw new Error("Paste a valid GitHub personal access token.");
    const previous=this.token;this.token=value;
    try{
      const user=await this.request("/user");
      if(!user?.login)throw new Error("GitHub did not return an account profile.");
      this.user={login:user.login,avatar_url:user.avatar_url||"",html_url:user.html_url||""};
      sessionStorage.setItem(TOKEN_KEY,value);
      return this.user;
    }catch(error){this.token=previous;throw error;}
  }
  async restore(){
    if(!this.token)return null;
    try{
      const user=await this.request("/user");
      this.user={login:user.login,avatar_url:user.avatar_url||"",html_url:user.html_url||""};
      return this.user;
    }catch(error){
      if(error.status===401||error.status===403){this.signOut();return null;}
      throw error;
    }
  }
  signOut(){
    this.token="";this.user=null;sessionStorage.removeItem(TOKEN_KEY);
  }
  async findSaveGist(){
    if(this.gistId){
      try{
        const gist=await this.request("/gists/"+encodeURIComponent(this.gistId));
        if(gist.files?.[SAVE_FILE])return gist;
      }catch{}
      this.gistId="";localStorage.removeItem(GIST_KEY);
    }
    for(let page=1;page<=10;page++){
      const gists=await this.request("/gists?per_page=100&page="+page);
      const found=gists.find(g=>g.files?.[SAVE_FILE]);
      if(found){this.gistId=found.id;localStorage.setItem(GIST_KEY,found.id);return await this.request("/gists/"+encodeURIComponent(found.id));}
      if(gists.length<100)break;
    }
    return null;
  }
  async load(){
    const gist=await this.findSaveGist();
    if(!gist)return null;
    this.gistId=gist.id;localStorage.setItem(GIST_KEY,gist.id);
    const raw=gist.files?.[SAVE_FILE]?.content;
    if(!raw)return null;
    try{return JSON.parse(raw);}catch{throw new Error("Your Rincon save Gist contains invalid JSON and was not loaded.");}
  }
  async save(payload){
    const content=JSON.stringify({...payload,version:1,account:this.user?.login||null,savedAt:new Date().toISOString()},null,2);
    const existing=await this.findSaveGist();
    if(existing){
      const updated=await this.request("/gists/"+encodeURIComponent(existing.id),{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({files:{[SAVE_FILE]:{content}}})
      });
      this.gistId=updated.id;localStorage.setItem(GIST_KEY,updated.id);return updated;
    }
    const created=await this.request("/gists",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({description:"Rincon Casino player save (secret/unlisted Gist)",public:false,files:{[SAVE_FILE]:{content}}})
    });
    this.gistId=created.id;localStorage.setItem(GIST_KEY,created.id);return created;
  }
}
