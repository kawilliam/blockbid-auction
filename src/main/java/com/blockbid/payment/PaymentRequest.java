package com.blockbid.payment;

public class PaymentRequest {
	private String cardNumber, nameOnCard, expirationDate, securityCode;
	private Boolean expeditedShipping;
	
	public PaymentRequest() {}

	public String getCardNumber() {
		return cardNumber;
	}

	public void setCardNumber(String cardNumber) {
		this.cardNumber = cardNumber;
	}

	public String getNameOnCard() {
		return nameOnCard;
	}

	public void setNameOnCard(String nameOnCard) {
		this.nameOnCard = nameOnCard;
	}

	public String getExpirationDate() {
		return expirationDate;
	}

	public void setExpirationDate(String expirationDate) {
		this.expirationDate = expirationDate;
	}

	public String getSecurityCode() {
		return securityCode;
	}

	public void setSecurityCode(String securityCode) {
		this.securityCode = securityCode;
	}

	public Boolean getExpeditedShipping() {
		return expeditedShipping;
	}

	public void setExpeditedShipping(Boolean expeditedShipping) {
		this.expeditedShipping = expeditedShipping;
	}
	
	
}
