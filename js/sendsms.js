var mobNum;
var str;
var s;
var i = 0;
var j;
var variable = 0;
var resp;
var txt;
var tab;
var templateSelected = 0;
recepients = [];
recpnum = [];
recipientInfo = {};
updates = [];
names = [];
utils={};
var msgContent;
var entity;
var sendsmsdata;
successList = [];
failureList = [];
data=[];
var status;
data = [];
$(document).ready(function() {
    ZOHO.embeddedApp.on("PageLoad", function(data) {
        var id = data.EntityId;
        var id_len = id.length;
        if(id_len <= 50){
            $('#loading').show();
    		var count=0;
    		utils.n=0;
            tab = "";
            entity = data.Entity;
            for (var id in data.EntityId) {
                ZOHO.CRM.API.getRecord({
                        Entity: entity,
                        RecordID: data.EntityId[id]
                    })
                    .then(function(data) {
                        utils.n++;
                        recepients.push({
                            "data": data
                        })
                        names.push(data.data[0].Full_Name);
                        recpnum.push({
                            "data": names
                        });
                        var preload_data = recpnum;
                        var preload_ids = [];
                        for (var i=0; i< preload_data.length; i++) {
                            preload_ids.push(preload_data[i].data[i]);
                        }
                         $('#recipients').select2({
                            tags: true,
                            data: preload_ids,
                            minimumResultsForSearch: -1
                        });

                        $('#recipients').select2('val', preload_ids);

                        $('#recipients').on('select2:open', function() {
                            $(this).select2('close');
                        });

                    })
                   
            } 
        } 
        else{
            $(".maindiv").hide();
            $(".sms_error").show();
        }               

    })
    ZOHO.embeddedApp.init().then(function() {}).then(function() {
       
	        ZOHO.CRM.META.getFields({
	            "Entity": "Leads"
	        }).then(function(data) {
	            var fieldsrc = $("#fieldsList").html(); 
	            var fieldTemplate = Handlebars.compile(fieldsrc); 
	            var html = fieldTemplate(data); 
	            $("#fieldnames").html(html); 
	        });
        
    }).then(function() {
        ZOHO.CRM.API.getOrgVariable("twilio.Account_SID").then(function(data) {
            utils.accntSID = data.Success.Content;
        }).then(function() {
            ZOHO.CRM.API.getOrgVariable("twilio.AuthToken").then(function(data) {
                utils.auth = data.Success.Content;
                str = utils.accntSID + ":" + utils.auth;
                utils.encodedAuth = btoa(str);
                utils.encodedAuth = utils.encodedAuth.trim();
            }).then(function() {
                request = {
                    url: "https://api.twilio.com/2010-04-01/Accounts/"+utils.accntSID+"/IncomingPhoneNumbers.json",
                    headers: {
                        Authorization: "Basic " + utils.encodedAuth,
                    }
                }
                ZOHO.CRM.HTTP.get(request)
                    .then(function(data) {
                        var list = JSON.parse(data);
                        var numbers = $('#fromNum').html();
                        var numbersTemplate = Handlebars.compile(numbers);
                        $("#listNumbers").html(numbersTemplate(list));
                    });
            }).then(function() {
                ZOHO.CRM.API.getAllRecords({
                        Entity: "twilio.Twilio_SMS_Templates",
                        sort_order: "desc"
                    })
                    .then(function(data) {
                            s = {
                                "obj": data
                            };
                            if(data.status==204){
                                document.getElementById("templist").innerHTML='<select id="sms_template" class="fldtype1"><option id="none">--None--</option></select>'
                                $('#loading').hide();
                            }
                            else{
                                var tempSrc = $('#templates').html();
                                var tempTemplate = Handlebars.compile(tempSrc);
                                var temphtml = tempTemplate(s);
                                $("#templist").html(temphtml);
                                $('#loading').hide();    
                            }  
                    })
            })
        })
    })

});

function back()
{
    $('#loading').show();
    $('#create').hide();
    $('#getTemp').show();
    ZOHO.CRM.API.getAllRecords({
        Entity: "twilio.Twilio_SMS_Templates",
        sort_order: "desc"
    })
    .then(function(data) {
        if (data.status == 204) {
            $('#listTemplatesDiv').hide();
        } else {
            s = {
                "obj": data
            };
            var tempSrc = $('#templates').html();
            var tempTemplate = Handlebars.compile(tempSrc);
            var temphtml = tempTemplate(s);
            $("#templist").html(temphtml);
            ZOHO.CRM.API.getRecord({
				Entity: "twilio.Twilio_SMS_Templates",
				RecordID: data.data[0].id
			})
	        .then(function(data) {
	            document.getElementById("sms_template").options[1].selected=true;
	            txt = (data.data[0]["twilio.Template_Message"]);
	            document.getElementById("msgTxt").innerHTML = txt;
	            templateSelected = 1;
	            $('#loading').hide();
	        })
        }
    })

}

function changeFields() {
	var module = document.getElementById("crm_module").value;
	ZOHO.CRM.META.getFields({
        "Entity": module
    }).then(function(data) {
        var fieldsrc = $("#fieldsList").html(); 
        var fieldTemplate = Handlebars.compile(fieldsrc); 
        var html = fieldTemplate(data); 
        $("#fieldnames").html(html); 
    });

}

function deleteRow(i,id) {
    var x=parseInt(i)
    if(recepients.length==1){
        document.getElementsByClassName("viewmore-div")[0].style.borderTopColor="#ff0000";
        $("#recp").show();
    }
    else
    {
		for(var k in recepients)
		{
		    if(recepients[k].data.id==id)
		    {
		        console.log(recepients[k].data.Full_Name)
		    	recepients.splice(k, 1);
		    	$('#'+id).remove();
			}
		}
		if(recepients.length>=6){
		    document.getElementById(recepients[5].data.id).style.display="block";
		     $("#"+recepients[5].data.id).removeClass('hidden').addClass('conlist');
		}
	}
}
function addField() {
    document.getElementById("msgTxt").value += "$(" + document.getElementById("insert_fields").value + ")";
}

function addFields() {
	document.getElementById("templateTxt").value += "$(" + document.getElementById("insert_fields").value + ")";
}

function update() {
   
    template = {};
    template.name = document.getElementById("templateName").value
    template.module = document.getElementById("crm_module").value
    template.content = document.getElementById("templateTxt").value
    if(template.name==""){
        document.getElementById("templateName").style.borderBottomColor="#ff0000";
        $("#tempNameEmptyDiv").show();
    }
    else if (template.content=="")
	{
	   document.getElementById("templateTxt").style.borderColor="#ff0000"; 
	   $("#templateEmptyAlert").show();
	}

    if(template.name!=""&&template.content!="")
    {
        $('#loading').show();
        var recordData = {
            "twilio.CustomModule3_Name": template.name,
            "twilio.Template_Message": template.content,
            "twilio.CRM_Module": template.module
        }
        ZOHO.CRM.API.insertRecord({
                Entity: "twilio.Twilio_SMS_Templates",
                APIData: recordData
            })
            .then(function(data) {
                $('#loading').hide();
                $('#successMsg').show();
    			setTimeout('$("#successMsg").hide()',1000);
                return back();
                 
            });
    }
}

function addTemp() {
    $('#getTemp').hide();
    $('#create').show();
    document.getElementById("templateName").value = "";
    document.getElementById("templateTxt").value = "";
    document.getElementById("insert_fields").options[0].selected=true;
    document.getElementById("templateName");
    $("#tempNameEmptyDiv").hide();
    document.getElementById("templateTxt").style.borderColor="rgb(206, 206, 206)"; 
	$("#templateEmptyAlert").hide();
}

function listTemplates() {
    $('#loading').show();
    var selectedTemplate = document.getElementById("sms_template").value;
    var ind = document.getElementById("sms_template").selectedIndex;
    utils.id = document.getElementById("sms_template").getElementsByTagName("option")[ind].value;
    var b;
    if (selectedTemplate == "--None--") {
        document.getElementById("msgTxt").innerHTML = "";
    }
    ZOHO.CRM.API.getRecord({
            Entity: "twilio.Twilio_SMS_Templates",
            RecordID: utils.id
        })
        .then(function(data) {
           $('#loading').hide();
           txt = (data.data[0]["twilio.Template_Message"]);
           document.getElementById("msgTxt").innerHTML = txt;
           templateSelected = 1;
        })
}

function skip() {
    $("#create").hide();
    $("#getTemp").show();
}

function validateFields() {

    var validationStatus = true;
    var msg = document.getElementById("msgTxt").value;
    if((msg.trim() == "") || (msg == "undefined")) {
        $(".msg_error").show();
        validationStatus = false;
    }
    return validationStatus;
}

function sendsms() {

    var validationStatus = validateFields();
    if (!validationStatus) {
        return false;
    }

    $(".sendbtn").val("Sending...");

    msgContent = document.getElementById("msgTxt").value;
    var frmNo = document.getElementById("from_number").value;

    // write your own code to send sms
   


}



function generatePersonalMessage(message, fields, record) {

    for (var index in fields) {
        var replaceStr = record.data.data[0][fields[index]];
        if (fields[index] == "Owner") {
            replaceStr = record.data.data[0][fields[index]].name;
        }
        message = message.replace("$(" + fields[index] + ")", replaceStr);
    }
    return message;
}


function showReport (data, messages, frmNo) {
    var statusRep = [];
    var Status;
     for(var i in data) {
        resp = data[i];
        for(var j in resp) {
            respp = resp[j];
            data1 = respp.data;
            recp = respp.recepients;
            error_code = data1.code;
            if(error_code > 0) {
                Status = "Failure"; 
                reason = data1.message.substr(0,98);
            }
            else {
                Status = "Success";
                reason = "--";
            }

            statusRep.push({
                Name: recp.data.data[0].Full_Name,
                From: frmNo,
                To: recp.data.data[0].Mobile,
                Status: Status,
                FailureReason: reason
            })
            if(Status == "Success") {
                var recData = {
                     "twilio.SMS_Texts_Name": "Outbound SMS",
                     "twilio.Status": data1.status,
                     "twilio.Direction":data1.direction,
                     "twilio.From_Number":data1.from,
                     "twilio.To_Number":data1.to,
                     "twilio.Custom_SMS_Message":messages[j],
                 }
                 if(entity == "Leads")
                 {
                         recData['twilio.Lead'] = recp.data.data[0].id
                 }
                 else
                 {
                     recData['twilio.Contact'] = recp.data.data[0].id
                 }
                 ZOHO.CRM.API.insertRecord({
                     Entity: "twilio.SMS_Texts",
                     APIData: recData
                 }).then(function(data) {
                    //console.log(data);
                 });
             }

        }
     }

    var report = $('#reportScript').html();
    var reportTemplate = Handlebars.compile(report);
    $("#statusReport").html(reportTemplate({
        data: statusRep
    }));
    $("#getTemp").hide();
    $("#report").show();
    $('#loading').hide();

}

function closePopUp(toReload) {
    if (toReload) {
        return ZOHO.CRM.UI.Popup.closeReload();
    } else {
        return ZOHO.CRM.UI.Popup.close();
    }
}

