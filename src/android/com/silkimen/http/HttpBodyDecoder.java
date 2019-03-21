package com.silkimen.http;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.MalformedInputException;

public class HttpBodyDecoder {
  private static final String[] ACCEPTED_CHARSETS = new String[] { "UTF-8", "ISO-8859-1" };

  public static String decodeBody(ByteBuffer rawOutput, String charsetName)
      throws CharacterCodingException, MalformedInputException {

    if (charsetName == null) {
      return tryDecodeByteBuffer(rawOutput);
    }

    return decodeByteBuffer(rawOutput, charsetName);
  }

  private static String tryDecodeByteBuffer(ByteBuffer rawOutput) throws CharacterCodingException, MalformedInputException {

    for (int i = 0; i < ACCEPTED_CHARSETS.length - 1; i++) {
      try {
        return decodeByteBuffer(rawOutput, ACCEPTED_CHARSETS[i]);
      } catch (MalformedInputException e) {
        continue;
      } catch (CharacterCodingException e) {
        continue;
      }
    }

    return decodeBody(rawOutput, ACCEPTED_CHARSETS[ACCEPTED_CHARSETS.length - 1]);
  }

  private static String decodeByteBuffer(ByteBuffer rawOutput, String charsetName)
      throws CharacterCodingException, MalformedInputException {

    return createCharsetDecoder(charsetName).decode(rawOutput).toString();
  }

  private static CharsetDecoder createCharsetDecoder(String charsetName) {
    return Charset.forName(charsetName).newDecoder().onMalformedInput(CodingErrorAction.REPORT)
        .onUnmappableCharacter(CodingErrorAction.REPORT);
  }
}
