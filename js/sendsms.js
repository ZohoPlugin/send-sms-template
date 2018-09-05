
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
