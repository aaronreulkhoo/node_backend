var io = require('socket.io-client')
, assert = require('assert')
, expect = require('expect.js');
var should = require('should');
var socketURL = 'https://esc-acorn-backend.herokuapp.com/';
const socketKey= "BBO5e7IVtK9TeSAQ3RTYGsQOWOZ0QAe8k9jbvomydoOUEjK1lwTLIkK4J3yu";
var options ={
  transports: ['websocket'],
  'forceNew': true,
  query: { key: socketKey }
};


var count2=0;
function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
 }
describe('Suite of unit tests', function() {
    beforeEach(function(done){
        this.timeout(5000);
        var ready = 0;
        var beforedisconnect = setInterval(function(){
            if(ready>1){
                clearInterval(beforedisconnect);
                done();
            }
            ready++;
        }, 1000);
    });
    it('Test the Availability', function(done){
        this.timeout(150000);
        console.log("1) Test the Availability");
        var i=0;
        var clients1=[];
        var count1=0;
        clients1[10] = io.connect(socketURL, options);
        clients1[10].on('connect', ()=> {
            console.log("cilent test connected");
        });
        clients1[10].on("CountingSuccess", ()=>{
            if(count1===10){
                clients1[10].disconnect();
                done();
            }
        });
        async function createClient(n){
            clients1[n] = io.connect(socketURL, options);
            clients1[n].on('connect', ()=> {
                console.log("cilent " + n + " connected");
                var number = Math.floor(Math.random()*3);
                console.log("Get Agent "+ number);
                clients1[n].emit('getAgent', {category:number, firstName:"Emma", lastName:"Watson"});
            });
            clients1[n].on('getAgentSuccess', (data)=>{
                count1++;
                console.log("cilent " + n + " get success: "+data.agentName);
                var ready = 0;
                var beforedisconnect = setInterval(function(){
                    if(ready>1){
                        console.log("cilent " + n + " disconnected");
                        clients1[n].disconnect();
                        clearInterval(beforedisconnect);
                    }
                    ready++;
                }, 1000);
            });
        }
        var interval = setInterval(function(){
            createClient(i);
            i++;
            if(i>=10){
            clearInterval(interval);
            }
        }, 3000);      
    });
    it('Test the Queueing', function(done){
        this.timeout(60000);
        console.log("2) Test the Queue");
        var count2 = 0;
        var i=0;
        var clients2=[];
        clients2[10] = io.connect(socketURL, options);
        clients2[10].on('connect', ()=> {
            console.log("cilent test connected");
        });
        clients2[10].on("CountingSuccess", ()=>{
            count2++;
            if(count2===10){
                console.log("All get success");
                clients2[10].disconnect();
                done();
            }
        }); 
        async function createClient(i){
            clients2[i] = io.connect(socketURL, options);
            clients2[i].on('connect', ()=> {
                console.log("cilent " + i + " connected");
                console.log("Get Agent 2");
                clients2[i].emit('getAgent', {category:2, firstName:"Emma", lastName:"Watson"});
            });
            clients2[i].on('getAgentSuccess', (data)=>{
                    console.log("cilent " + i + " get success: "+data.agentName);
                    var ready = 0;
                    var beforedisconnect = setInterval(function(){
                        if(ready>1){
                            console.log("cilent " + i + " disconnected");
                            clients2[i].disconnect();
                            clearInterval(beforedisconnect);
                        }
                        ready++;
                    }, 1000);
                    
            });
        }
        
        var interval = setInterval(function(){
            createClient(i);
            i++;
            if(i>=10){
            clearInterval(interval);
            }
        }, 3000);

    });
    
    it("Test the authentication of connection", function(done){
        this.timeout(5000);
        console.log("3) Test the authentication of connection");
        const socketKey= "BBO5e7IVtK9TeSAQ3RTYGsQOWOZ0QAe8k9jbvomydoOUEjK1lwTLIkK4J3yu";
        var options ={
        transports: ['websocket'],
        'forceNew': true,
        query: { key: socketKey }
        };
        clientAuth = io.connect(socketURL, options);
        
        clientAuth.on('connect', function(){
            var ready = 0;
            var beforedisconnect = setInterval(function(){
                if(ready>1){
                    console.log("Connection Success");
                    clearInterval(beforedisconnect);
                    clientAuth.disconnect();
                    done();
                }
                ready++;
            })
            
        })
    });

    it("Testing the unauthenticated connection with wrong socketKey", function(done){
        this.timeout(5000);
        console.log("4) Testing the unauthenticated connection with wrong socketKey");
        const socketKey= "wrongkey1";
        var options ={
        transports: ['websocket'],
        'forceNew': true,
        query: { key: socketKey }
        };
        var client = io.connect(socketURL, options);
        client.on('error', function(error){
            expect(error).to.eql('Authentication error');
            console.log("connection is unauthenticated");
            done();
        });
    });

    it("Testing the unauthenticated connection without socketKey", function(done){
        this.timeout(5000);
        console.log("5) Testing the unauthenticated connection without socketKey");
        var options ={
        transports: ['websocket'],
        'forceNew': true,
        };
        var client = io.connect(socketURL, options);
        client.on('error', function(error){
            expect(error).to.eql('Authentication error');
            console.log("connection is unauthenticated");
            done();
        });
    });


});
